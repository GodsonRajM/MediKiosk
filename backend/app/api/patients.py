import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from app.schemas.patient import PatientCreate, PatientUpdate, PatientResponse, PatientIdentifierSchema, MedicalRecordCreate
from app.core.database import db
from app.core.security import get_current_user
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/search", response_model=List[PatientResponse])
async def search_patients(
    q: str = Query(..., description="Query by Patient ID (e.g. MK-P10001), full name, or phone"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    query = q.strip().lower()
    results = []

    for p in db.patients.values():
        if (
            query in p.get("medikiosk_id", "").lower() or
            query in p.get("full_name", "").lower() or
            query in p.get("phone", "").lower() or
            query in p.get("email", "").lower()
        ):
            identifiers = [
                PatientIdentifierSchema(**i)
                for i in db.patient_identifiers
                if i["patient_id"] == p["id"]
            ]
            results.append(PatientResponse(
                id=p["id"],
                medikiosk_id=p["medikiosk_id"],
                full_name=p["full_name"],
                date_of_birth=p.get("date_of_birth"),
                age=p.get("age"),
                gender=p.get("gender", "Other"),
                phone=p["phone"],
                email=p.get("email"),
                address=p.get("address"),
                blood_group=p.get("blood_group"),
                emergency_contact_name=p.get("emergency_contact_name"),
                emergency_contact_phone=p.get("emergency_contact_phone"),
                preferred_language=p.get("preferred_language", "en"),
                identifiers=identifiers
            ))

    return results

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    patient = db.patients.get(patient_id)
    if not patient:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                patient = p
                break
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    identifiers = [
        PatientIdentifierSchema(**i)
        for i in db.patient_identifiers
        if i["patient_id"] == patient["id"]
    ]

    return PatientResponse(
        id=patient["id"],
        medikiosk_id=patient["medikiosk_id"],
        full_name=patient["full_name"],
        date_of_birth=patient.get("date_of_birth"),
        age=patient.get("age"),
        gender=patient.get("gender", "Other"),
        phone=patient["phone"],
        email=patient.get("email"),
        address=patient.get("address"),
        blood_group=patient.get("blood_group"),
        emergency_contact_name=patient.get("emergency_contact_name"),
        emergency_contact_phone=patient.get("emergency_contact_phone"),
        preferred_language=patient.get("preferred_language", "en"),
        identifiers=identifiers
    )

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(patient_id: str, req: PatientUpdate, current_user: Dict[str, Any] = Depends(get_current_user)):
    patient = db.patients.get(patient_id)
    if not patient:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                patient = p
                patient_id = p["id"]
                break
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    update_data = req.dict(exclude_unset=True)
    for key, val in update_data.items():
        if val is not None:
            patient[key] = val

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("patients").update(update_data).eq("id", patient_id).execute()
        except Exception:
            pass

    return await get_patient(patient_id, current_user)

# ------------------------------------------------------------------------------
# Medical History CRUD (Scans, Prescriptions, Lab Tests)
# ------------------------------------------------------------------------------

@router.get("/{patient_id}/history")
async def get_patient_medical_history(patient_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    # Match by patient UUID or medikiosk_id
    real_p_id = patient_id
    if patient_id not in db.patients:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                real_p_id = p["id"]
                break

    records = [r for r in db.medical_history if r.get("patient_id") == real_p_id]
    return sorted(records, key=lambda x: x.get("date_recorded") or "", reverse=True)

@router.post("/{patient_id}/history")
async def create_patient_medical_history(
    patient_id: str,
    req: MedicalRecordCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    real_p_id = patient_id
    if patient_id not in db.patients:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                real_p_id = p["id"]
                break

    record_id = str(uuid.uuid4())
    record = {
        "id": record_id,
        "patient_id": real_p_id,
        "record_type": req.record_type,
        "title": req.title,
        "description": req.description or "",
        "file_name": req.file_name,
        "file_path": req.file_path,
        "ocr_extracted_text": req.ocr_extracted_text or "",
        "date_recorded": req.date_recorded or datetime.utcnow().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat()
    }
    db.medical_history.append(record)

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("medical_history").insert(record).execute()
        except Exception:
            pass

    return {"status": "SUCCESS", "record": record}

@router.delete("/{patient_id}/history/{record_id}")
async def delete_patient_medical_history(
    patient_id: str,
    record_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    initial_len = len(db.medical_history)
    db.medical_history = [r for r in db.medical_history if r.get("id") != record_id]

    if len(db.medical_history) == initial_len:
        raise HTTPException(status_code=404, detail="Medical history record not found")

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("medical_history").delete().eq("id", record_id).execute()
        except Exception:
            pass

    return {"status": "SUCCESS", "message": "Record deleted successfully"}
