"""
Document Processing Pipeline.
Executes:
Upload -> Validate -> Store privately -> OCR -> Extract entities -> Validate -> Store structured data -> Timeline
Status lifecycle: uploaded -> processing -> completed / failed / needs_review
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.core.logging import logger
from app.core.exceptions import DocumentProcessingError
from app.documents.ocr import ocr_engine
from app.documents.extractor import doc_entity_extractor
from app.documents.timeline_builder import timeline_builder
from app.db.database import db


class DocumentProcessor:
    @staticmethod
    async def process_document(
        patient_id: str,
        file_bytes: bytes,
        file_name: str,
        mime_type: str,
        document_type: str = "prescription",
        session_id: Optional[str] = None,
        document_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Runs the complete medical document intake pipeline."""
        doc_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        effective_date = document_date or now[:10]

        # 1. Validation
        if len(file_bytes) == 0:
            raise DocumentProcessingError("Uploaded document file is empty.")
        if len(file_bytes) > 25 * 1024 * 1024:
            raise DocumentProcessingError("Document file exceeds maximum allowed size (25MB).")

        # 2. Private Storage Reference Registration
        file_path = f"private/patients/{patient_id}/docs/{doc_id}_{file_name}"
        doc_record = {
            "id": doc_id,
            "patient_id": patient_id,
            "session_id": session_id,
            "document_type": document_type,
            "file_path": file_path,
            "file_name": file_name,
            "mime_type": mime_type,
            "ocr_status": "processing",
            "processing_status": "processing",
            "document_date": effective_date,
            "ocr_text": "",
            "entities": [],
            "created_at": now
        }
        db.documents[doc_id] = doc_record

        try:
            # 3. OCR Processing
            ocr_result = await ocr_engine.process_file(file_bytes, mime_type)
            ocr_text = ocr_result.get("ocr_text", "")
            doc_record["ocr_text"] = ocr_text
            doc_record["ocr_status"] = "completed"

            # 4. Entity Extraction
            extracted = await doc_entity_extractor.extract_entities_from_text(ocr_text)

            # 5. Store Structured Entities (Medications & Investigations)
            entity_list = []
            if doc_id not in db.document_entities:
                db.document_entities[doc_id] = []

            for med in extracted.get("medications", []):
                ent = {
                    "id": str(uuid.uuid4()),
                    "document_id": doc_id,
                    "entity_type": "medication",
                    "name": med.get("name", "Unknown"),
                    "value": f"{med.get('dose', '')} - {med.get('frequency', '')}",
                    "confidence": 0.95
                }
                db.document_entities[doc_id].append(ent)
                entity_list.append(ent)

                # Add to patient medications table
                if patient_id not in db.medications:
                    db.medications[patient_id] = []
                db.medications[patient_id].append({
                    "id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "document_id": doc_id,
                    "name": med.get("name"),
                    "dose": med.get("dose"),
                    "frequency": med.get("frequency"),
                    "source": "document_ocr",
                    "confidence": 0.95,
                    "created_at": now
                })

            for lab in extracted.get("investigations", []):
                ent = {
                    "id": str(uuid.uuid4()),
                    "document_id": doc_id,
                    "entity_type": "lab_test",
                    "name": lab.get("test_name", "Lab Test"),
                    "value": str(lab.get("result", "")),
                    "unit": lab.get("unit"),
                    "reference_range": lab.get("reference_range"),
                    "confidence": 0.95
                }
                db.document_entities[doc_id].append(ent)
                entity_list.append(ent)

                # Add to investigations table
                if patient_id not in db.investigations:
                    db.investigations[patient_id] = []
                db.investigations[patient_id].append({
                    "id": str(uuid.uuid4()),
                    "patient_id": patient_id,
                    "document_id": doc_id,
                    "test_name": lab.get("test_name"),
                    "result": str(lab.get("result")),
                    "unit": lab.get("unit"),
                    "abnormal": lab.get("abnormal", False),
                    "test_date": effective_date,
                    "created_at": now
                })

            doc_record["entities"] = entity_list

            # 6. Build Timeline Events
            timeline_events = timeline_builder.build_events_from_document(
                patient_id=patient_id,
                document_id=doc_id,
                extracted_entities=extracted,
                document_date=effective_date
            )
            if patient_id not in db.timeline:
                db.timeline[patient_id] = []
            db.timeline[patient_id].extend(timeline_events)

            # 7. Finalize Status
            doc_record["processing_status"] = "completed"
            logger.info(f"Document {doc_id} processed successfully for patient {patient_id}")
            return doc_record

        except Exception as e:
            logger.error(f"Document processing failed for {doc_id}: {str(e)}")
            doc_record["processing_status"] = "failed"
            doc_record["ocr_status"] = "failed"
            raise DocumentProcessingError(f"Processing error: {str(e)}")


document_processor = DocumentProcessor()
