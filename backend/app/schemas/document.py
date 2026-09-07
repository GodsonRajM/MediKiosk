"""
Document Schemas.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class DocumentUploadMetadata(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    document_type: str  # prescription, lab_report, discharge_summary, other
    document_date: Optional[str] = None


class DocumentEntityResponse(BaseModel):
    id: str
    entity_type: str  # medication, lab_test, diagnosis, doctor_note
    name: str
    value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    confidence: float


class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    document_type: str
    file_name: str
    mime_type: str
    ocr_status: str  # pending, processing, completed, failed
    processing_status: str  # uploaded, processing, completed, failed, needs_review
    document_date: Optional[str] = None
    ocr_text_preview: Optional[str] = None
    entities: List[DocumentEntityResponse] = []
    created_at: str
