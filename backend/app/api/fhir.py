from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.core.database import db
from app.integrations.fhir_adapter import fhir_adapter

router = APIRouter(prefix="/fhir", tags=["FHIR Interoperability"])

@router.get("/patient/{patient_id}/bundle")
async def export_fhir_bundle(patient_id: str):
    patient = db.patients.get(patient_id)
    if not patient:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                patient = p
                patient_id = p["id"]
                break
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    session = next((s for s in db.clinical_sessions.values() if s["patient_id"] == patient_id), {})
    conditions = [c for c in db.medical_conditions if c["patient_id"] == patient_id]
    medications = [m for m in db.medications if m["patient_id"] == patient_id]
    allergies = [a for a in db.allergies if a["patient_id"] == patient_id]
    investigations = [i for i in db.investigations if i["patient_id"] == patient_id]

    bundle = fhir_adapter.export_patient_bundle(
        patient=patient,
        session=session,
        conditions=conditions,
        medications=medications,
        allergies=allergies,
        investigations=investigations
    )
    return bundle
