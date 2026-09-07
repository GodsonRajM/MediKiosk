"""
Medical Timeline Routes.
"""
from typing import List, Dict, Any
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.services.timeline_service import timeline_service
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("/patients/{patient_id}/timeline", response_model=APIResponse[List[Dict[str, Any]]])
@router.get("/timeline/{patient_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_patient_timeline(patient_id: str):
    timeline_events = timeline_service.get_patient_timeline(patient_id)
    audit_service.log_action(
        action="TIMELINE_VIEWED",
        resource_type="timeline",
        patient_id=patient_id
    )
    return APIResponse(success=True, data=timeline_events)
