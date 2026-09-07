"""
Patient Management Routes.
Enforces access authorization checks when a doctor accesses clinical records.
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Header
from app.core.config import settings
from app.core.exceptions import AccessDeniedError
from app.schemas.common import APIResponse
from app.schemas.patient import PatientCreate, PatientResponse, PatientSummaryCard
from app.services.patient_service import patient_service
from app.services.access_service import access_service
from app.services.audit_service import audit_service
from app.db.database import db

router = APIRouter()


@router.get("/patients", response_model=APIResponse[List[PatientSummaryCard]])
async def list_patients():
    """Returns patient triage list for clinical queue."""
    patients = patient_service.get_all_patients()
    return APIResponse(success=True, data=patients)


@router.post("/patients", response_model=APIResponse[PatientResponse])
async def create_patient(data: PatientCreate):
    created = patient_service.create_patient(data)
    audit_service.log_action(
        action="PATIENT_CREATED",
        resource_type="patient",
        resource_id=created["id"],
        patient_id=created["id"]
    )
    return APIResponse(success=True, data=PatientResponse(**created), message="Patient registered successfully")


@router.get("/patients/{patient_id}", response_model=APIResponse[Dict[str, Any]])
async def get_patient(
    patient_id: str,
    x_doctor_id: Optional[str] = Header(None, alias="X-Doctor-Id")
):
    """
    Retrieves full patient clinical dossier.
    Enforces authorization check: A doctor must have an approved access grant or encounter.
    """
    patient = patient_service.get_patient_by_id(patient_id)
    actual_pid = patient["id"]

    # Security check: if accessing as doctor
    if x_doctor_id:
        has_access = access_service.check_patient_access(x_doctor_id, actual_pid)
        if not has_access and not settings.DEMO_MODE:
            raise AccessDeniedError(
                f"Doctor {x_doctor_id} does not have approved clinical access to patient {patient.get('patient_code')}."
            )

    # Attach related clinical flags & summaries
    flags = db.red_flags.get(actual_pid, [])
    summary = None
    for _, s in db.summaries.items():
        if s.get("patient_id") == actual_pid:
            summary = s
            break

    audit_service.log_action(
        action="PATIENT_VIEWED",
        resource_type="patient",
        resource_id=actual_pid,
        user_id=x_doctor_id,
        patient_id=actual_pid
    )

    data = {
        "patient": patient,
        "red_flags": flags,
        "summary": summary
    }
    return APIResponse(success=True, data=data)
