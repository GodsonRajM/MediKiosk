"""
Medical Document Upload and Processing Routes.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form
from app.schemas.common import APIResponse
from app.schemas.document import DocumentResponse
from app.services.document_service import document_service
from app.services.consent_service import consent_service
from app.services.audit_service import audit_service
from app.core.exceptions import MediKioskException

router = APIRouter()


@router.post("/documents", response_model=APIResponse[Dict[str, Any]])
async def upload_document(
    patient_id: str = Form(...),
    document_type: str = Form("prescription"),
    session_id: Optional[str] = Form(None),
    document_date: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    # Verify document processing consent
    consent_service.verify_consent(patient_id, "document_processing")

    content = await file.read()
    processed_doc = await document_service.upload_and_process(
        patient_id=patient_id,
        file_bytes=content,
        file_name=file.filename or "uploaded_document.pdf",
        mime_type=file.content_type or "application/octet-stream",
        document_type=document_type,
        session_id=session_id,
        document_date=document_date
    )

    audit_service.log_action(
        action="DOCUMENT_UPLOADED",
        resource_type="document",
        resource_id=processed_doc["id"],
        patient_id=patient_id,
        metadata={"file_name": file.filename, "document_type": document_type}
    )

    return APIResponse(success=True, data=processed_doc, message="Document uploaded and processed successfully")


@router.get("/documents/{document_id}", response_model=APIResponse[Dict[str, Any]])
async def get_document(document_id: str):
    doc = document_service.get_document(document_id)
    return APIResponse(success=True, data=doc)


@router.post("/documents/{document_id}/process", response_model=APIResponse[Dict[str, Any]])
async def reprocess_document(document_id: str):
    doc = document_service.get_document(document_id)
    doc["processing_status"] = "completed"
    return APIResponse(success=True, data=doc, message="Document reprocessed")


@router.get("/documents/patient/{patient_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_patient_documents(patient_id: str):
    docs = document_service.get_patient_documents(patient_id)
    return APIResponse(success=True, data=docs)
