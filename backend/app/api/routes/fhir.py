"""
HL7 FHIR R4 Bundle Export Route (ABDM Compatible).
"""
from typing import Dict, Any
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.fhir.adapter import fhir_adapter
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("/fhir/patients/{patient_id}", response_model=APIResponse[Dict[str, Any]])
async def get_patient_fhir_bundle(patient_id: str):
    bundle = fhir_adapter.generate_patient_bundle(patient_id)
    audit_service.log_action(
        action="FHIR_BUNDLE_EXPORTED",
        resource_type="fhir_bundle",
        patient_id=patient_id
    )
    return APIResponse(success=True, data=bundle, message="FHIR R4 Bundle generated successfully")
