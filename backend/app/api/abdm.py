from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from app.integrations.abdm_adapter import abdm_adapter

router = APIRouter(prefix="/abdm", tags=["ABDM Interoperability (Mock)"])

class AbhaVerifyRequest(BaseModel):
    abha_id: str

class AbdmConsentRequest(BaseModel):
    patient_id: str
    doctor_id: str
    hi_types: List[str] = ["Prescription", "DiagnosticReport", "OPConsultation"]

@router.post("/verify-abha")
async def verify_abha(req: AbhaVerifyRequest):
    return abdm_adapter.verify_abha(req.abha_id)

@router.post("/consent/request")
async def create_consent(req: AbdmConsentRequest):
    return abdm_adapter.create_consent_artifact(req.patient_id, req.doctor_id, req.hi_types)

@router.get("/records/fetch/{consent_artifact_id}")
async def fetch_records(consent_artifact_id: str):
    return abdm_adapter.fetch_health_records(consent_artifact_id)
