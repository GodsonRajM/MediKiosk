"""
Document Service.
Coordinates file uploads, private storage references, OCR parsing, and entity retrieval.
"""
from typing import Dict, Any, Optional, List
from app.db.database import db
from app.documents.processor import document_processor
from app.core.exceptions import MediKioskException


class DocumentService:
    @staticmethod
    async def upload_and_process(
        patient_id: str,
        file_bytes: bytes,
        file_name: str,
        mime_type: str,
        document_type: str = "prescription",
        session_id: Optional[str] = None,
        document_date: Optional[str] = None
    ) -> Dict[str, Any]:
        return await document_processor.process_document(
            patient_id=patient_id,
            file_bytes=file_bytes,
            file_name=file_name,
            mime_type=mime_type,
            document_type=document_type,
            session_id=session_id,
            document_date=document_date
        )

    @staticmethod
    def get_document(document_id: str) -> Dict[str, Any]:
        doc = db.documents.get(document_id)
        if not doc:
            raise MediKioskException("Document not found", status_code=404, error_code="DOCUMENT_NOT_FOUND")
        return doc

    @staticmethod
    def get_patient_documents(patient_id: str) -> List[Dict[str, Any]]:
        return [d for _, d in db.documents.items() if d.get("patient_id") == patient_id]


document_service = DocumentService()
