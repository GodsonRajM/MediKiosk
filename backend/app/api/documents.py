import uuid
import re
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.database import db
from app.ai.document_ai_service import document_ai_service

router = APIRouter(prefix="/documents", tags=["Document Intelligence & OCR"])

@router.get("/patient/{patient_id}")
async def get_patient_documents(patient_id: str):
    real_p_id = patient_id
    if patient_id not in db.patients:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                real_p_id = p["id"]
                break
    docs = [d for d in db.documents if d.get("patient_id") == real_p_id]
    return docs

@router.post("/upload")
async def upload_document(
    patient_id: str = Form(...),
    session_id: Optional[str] = Form(None),
    doc_type: str = Form("LAB_REPORT"),
    file: UploadFile = File(...)
):
    real_p_id = patient_id
    if patient_id not in db.patients:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                real_p_id = p["id"]
                break

    doc_id = str(uuid.uuid4())
    content_bytes = await file.read()
    file_name = file.filename or "uploaded_document.pdf"

    # Attempt to extract actual text from file bytes
    extracted_text = ""
    try:
        extracted_text = content_bytes.decode('utf-8', errors='ignore').strip()
        # Clean control characters if binary
        extracted_text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', ' ', extracted_text)
        extracted_text = re.sub(r'\s+', ' ', extracted_text).strip()
    except Exception:
        extracted_text = ""

    if len(extracted_text) < 10:
        extracted_text = f"Document '{file_name}' ({doc_type}) uploaded for clinical verification."

    # Parse with AI / OCR service
    parsed = await document_ai_service.parse_document(extracted_text, doc_type)

    doc_record = {
        "id": doc_id,
        "patient_id": real_p_id,
        "session_id": session_id,
        "document_type": doc_type,
        "file_name": file_name,
        "file_path": f"/uploads/{file_name}",
        "mime_type": file.content_type or "application/pdf",
        "file_size_bytes": len(content_bytes),
        "ocr_raw_text": extracted_text,
        "ocr_status": "PROCESSED",
        "has_handwriting": False,
        "created_at": datetime.utcnow().isoformat()
    }
    db.documents.append(doc_record)

    # Also record in medical_history CRUD table for unified patient tracking
    db.medical_history.append({
        "id": doc_id,
        "patient_id": real_p_id,
        "record_type": doc_type,
        "title": file_name,
        "description": f"Uploaded {doc_type.replace('_', ' ').title()}",
        "file_name": file_name,
        "file_path": f"/uploads/{file_name}",
        "ocr_extracted_text": extracted_text,
        "date_recorded": datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat()
    })

    # Record investigations extracted from the actual document
    for inv in parsed.get("investigations", []):
        db.investigations.append({
            "id": str(uuid.uuid4()),
            "patient_id": real_p_id,
            "session_id": session_id,
            "test_name": inv["test_name"],
            "result_value": inv["result_value"],
            "unit": inv.get("unit", ""),
            "reference_range": inv.get("reference_range", ""),
            "is_abnormal": inv.get("is_abnormal", False),
            "test_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "source": "OCR",
            "confidence": inv.get("confidence", 0.95),
            "doctor_verified": False
        })

    return {
        "document_id": doc_id,
        "status": "PROCESSED",
        "extracted_data": parsed
    }
