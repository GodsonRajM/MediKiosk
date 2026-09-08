import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.schemas.patient import PatientCreate, PatientResponse, PatientIdentifierSchema
from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    patient = db.patients.get(patient_id)
    if not patient:
        # Search by MediKiosk ID
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
        gender=patient["gender"],
        phone=patient["phone"],
        email=patient.get("email"),
        emergency_contact_name=patient.get("emergency_contact_name"),
        emergency_contact_phone=patient.get("emergency_contact_phone"),
        preferred_language=patient.get("preferred_language", "en"),
        identifiers=identifiers
    )

@router.post("", response_model=PatientResponse)
async def create_patient(req: PatientCreate):
    new_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    next_num = len(db.patients) + 1
    medikiosk_id = f"MK-{str(next_num).zfill(6)}"

    patient_record = {
        "id": new_id,
        "user_id": user_id,
        "medikiosk_id": medikiosk_id,
        "full_name": req.full_name,
        "date_of_birth": req.date_of_birth,
        "age": req.age or 40,
        "gender": req.gender,
        "phone": req.phone,
        "email": req.email,
        "emergency_contact_name": req.emergency_contact_name,
        "emergency_contact_phone": req.emergency_contact_phone,
        "preferred_language": req.preferred_language
    }
    db.patients[new_id] = patient_record

    # Create MediKiosk identifier
    db.patient_identifiers.append({
        "id": str(uuid.uuid4()),
        "patient_id": new_id,
        "identifier_type": "INTERNAL_MEDIKIOSK_ID",
        "identifier_value": medikiosk_id,
        "issuing_system": "MediKiosk",
        "verified": True
    })

    if req.abha_number:
        db.patient_identifiers.append({
            "id": str(uuid.uuid4()),
            "patient_id": new_id,
            "identifier_type": "ABHA_NUMBER",
            "identifier_value": req.abha_number,
            "issuing_system": "ABDM Sandbox",
            "verified": True
        })

    return await get_patient(new_id)
