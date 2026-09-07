"""
Consent Management Routes.
"""
from typing import List, Dict, Any
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.schemas.consent import ConsentRecordCreate, ConsentResponse
from app.services.consent_service import consent_service
from app.services.audit_service import audit_service

router = APIRouter()


@router.post("/consents", response_model=APIResponse[List[ConsentResponse]])
async def record_consents(data: ConsentRecordCreate):
    recorded = consent_service.record_consents(data)
    audit_service.log_action(
        action="CONSENT_RECORDED",
        resource_type="consent",
        patient_id=data.patient_id,
        metadata={"count": len(data.consents)}
    )
    return APIResponse(success=True, data=recorded, message="Patient consents recorded successfully")


@router.get("/consents/{patient_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_patient_consents(patient_id: str):
    consents = consent_service.get_patient_consents(patient_id)
    return APIResponse(success=True, data=consents)
