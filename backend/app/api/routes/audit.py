"""
Audit Trail Inspection Routes (Privacy-Preserving).
"""
from typing import List, Dict, Any
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.db.database import db

router = APIRouter()


@router.get("/audit/patients/{patient_id}", response_model=APIResponse[List[Dict[str, Any]]])
async def get_patient_audit_trail(patient_id: str):
    logs = [log for log in db.audit_logs if log.get("patient_id") == patient_id]
    return APIResponse(success=True, data=logs)


@router.get("/audit/all", response_model=APIResponse[List[Dict[str, Any]]])
async def get_all_audit_logs():
    return APIResponse(success=True, data=db.audit_logs)
