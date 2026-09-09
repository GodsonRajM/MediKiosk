from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from datetime import datetime, timezone
import uuid

from app.core.database import db
from app.core.security import get_current_user
from app.ai.gemini_service import gemini_service
from app.schemas.document import DocumentUploadResponse

router = APIRouter(prefix="/documents", tags=["Medical Documents & OCR"])

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_medical_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Accepts real medical documents (scans, PDFs, prescriptions, reports).
    Executes OCR and document entity extraction, saving metadata and timeline entries into Supabase.
    """
    patient_id = current_user.get("sub")
    file_bytes = await file.read()
    file_name = file.filename or "medical_document.pdf"
    file_size = len(file_bytes)
    content_type = file.content_type or "application/octet-stream"

    # Process OCR & clinical entity extraction via Gemini Vision / OCR service
    ocr_result = gemini_service.process_medical_document(
        file_content=file_bytes,
        mime_type=content_type,
        file_name=file_name
    )

    doc_id = str(uuid.uuid4())
    storage_path = f"patient_{patient_id}/{doc_id}_{file_name}"

    # Insert document record in Supabase
    doc_record = {
        "id": doc_id,
        "patient_id": patient_id,
        "file_name": file_name,
        "file_type": content_type,
        "file_size": file_size,
        "storage_path": storage_path,
        "ocr_status": "completed",
        "ocr_text": ocr_result.get("extracted_text", ""),
        "ocr_confidence": 0.95,
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("medical_documents", doc_record)

    # Insert extracted entities
    entities = []
    for ent in ocr_result.get("entities", []):
        ent_record = {
            "id": str(uuid.uuid4()),
            "document_id": doc_id,
            "entity_type": ent.get("entity_type", "general"),
            "entity_name": ent.get("entity_name", "Clinical Fact"),
            "entity_value": ent.get("entity_value", ""),
            "confidence": ent.get("confidence", 0.95),
            "verified": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.insert("document_entities", ent_record)
        entities.append(ent_record)

    # Add to Unified Medical Timeline
    db.insert("medical_timeline", {
        "patient_id": patient_id,
        "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "event_type": "Medical Document Upload",
        "title": f"Uploaded: {file_name}",
        "description": f"OCR extraction completed. Found {len(entities)} clinical entities.",
        "source": "document",
        "source_id": doc_id
    })

    return DocumentUploadResponse(
        document_id=doc_id,
        file_name=file_name,
        ocr_status="completed",
        ocr_confidence=0.95,
        extracted_text=ocr_result.get("extracted_text"),
        entities=entities,
        created_at=doc_record["uploaded_at"]
    )

@router.get("")
def list_patient_documents(current_user: dict = Depends(get_current_user)):
    patient_id = current_user.get("sub")
    docs = db.select("medical_documents", {"patient_id": patient_id})
    return docs
