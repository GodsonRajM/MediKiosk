"""
Doctor-Patient Access Control Routes.
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.services.access_service import access_service
from app.services.audit_service import audit_service

router = APIRouter()


class AccessRequestData(BaseModel):
    doctor_id: str
    patient_id: str
    access_type: str = "encounter"
    reason: Optional[str] = "Clinical OPD Consultation"


@router.post("/access/request", response_model=APIResponse[Dict[str, Any]])
async def request_access(data: AccessRequestData):
    grant = access_service.request_patient_access(
        doctor_id=data.doctor_id,
        patient_id=data.patient_id,
        access_type=data.access_type,
        reason=data.reason
    )
    audit_service.log_action(
        action="ACCESS_REQUESTED",
        resource_type="patient_access",
        user_id=data.doctor_id,
        patient_id=data.patient_id,
        metadata={"access_type": data.access_type}
    )
    return APIResponse(success=True, data=grant, message="Access request submitted")


@router.post("/access/approve", response_model=APIResponse[Dict[str, Any]])
async def approve_access(data: AccessRequestData):
    grant = access_service.approve_patient_access(
        doctor_id=data.doctor_id,
        patient_id=data.patient_id
    )
    audit_service.log_action(
        action="ACCESS_APPROVED",
        resource_type="patient_access",
        user_id=data.doctor_id,
        patient_id=data.patient_id
    )
    return APIResponse(success=True, data=grant, message="Access request approved")
