from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.database import db

router = APIRouter(prefix="/audit", tags=["Audit Logging"])

@router.get("/patient/{patient_id}")
async def get_patient_audit_trail(patient_id: str):
    logs = [log for log in db.audit_logs if log.get("patient_id") == patient_id]
    return logs

@router.get("/all")
async def get_all_audit_logs():
    return db.audit_logs
