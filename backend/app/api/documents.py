import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import db
from app.ai.document_ai_service import document_ai_service

router = APIRouter(prefix="/documents", tags=["Document Intelligence & OCR"])

@router.get("/patient/{patient_id}")
async def get_patient_documents(patient_id: str):
    docs = [d for d in db.documents if d["patient_id"] == patient_id]
    return docs

@router.post("/upload")
async def upload_document(
    patient_id: str = Form(...),
    session_id: Optional[str] = Form(None),
    doc_type: str = Form("LAB_REPORT"),
    file: UploadFile = File(...)
):
    doc_id = str(uuid.uuid4())
    content_bytes = await file.read()
    file_name = file.filename or "uploaded_document.pdf"
    
    # Simulate OCR parsing
    simulated_text = f"HOSPITAL CLINICAL LABORATORY REPORT\nPatient: Sundaram Ramaswamy (MK-000001)\nDate: 2026-06-15\nTest: HbA1c (Glycated Hemoglobin)\nResult: 8.2 %\nReference: < 5.7 %\nSerum Creatinine: 1.0 mg/dL (Ref: 0.7 - 1.3 mg/dL)\nStatus: High Risk / Uncontrolled glycemic status."
    
    parsed = await document_ai_service.parse_document(simulated_text, doc_type)

    doc_record = {
        "id": doc_id,
        "patient_id": patient_id,
        "session_id": session_id,
        "document_type": doc_type,
        "file_name": file_name,
        "file_path": f"/uploads/{file_name}",
        "mime_type": file.content_type or "application/pdf",
        "file_size_bytes": len(content_bytes) or 142850,
        "ocr_raw_text": simulated_text,
        "ocr_status": "PROCESSED",
        "has_handwriting": False,
        "created_at": datetime.utcnow().isoformat()
    }
    db.documents.append(doc_record)

    # Insert investigations into DB
    for inv in parsed.get("investigations", []):
        db.investigations.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "session_id": session_id,
            "test_name": inv["test_name"],
            "result_value": inv["result_value"],
            "unit": inv["unit"],
            "reference_range": inv["reference_range"],
            "is_abnormal": inv["is_abnormal"],
            "test_date": "2026-06-15",
            "source": "OCR",
            "confidence": inv["confidence"],
            "doctor_verified": False
        })

    return {
        "document_id": doc_id,
        "status": "PROCESSED",
        "extracted_data": parsed
    }
