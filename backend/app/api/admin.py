from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, List
from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Hospital Administration & Analytics"])

@router.get("/metrics")
def get_system_metrics(current_user: dict = Depends(get_current_user)):
    """
    Returns real, live system operational statistics directly from authoritative Supabase tables.
    Zero mock/dummy numbers.
    """
    role = current_user.get("role")
    if role not in ["admin", "doctor", "triage"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative authorization required"
        )

    patients = db.select("profiles", {"role": "patient"})
    doctors = db.select("profiles", {"role": "doctor"})
    sessions = db.select("clinical_sessions")
    completed = [s for s in sessions if s.get("session_status") == "completed"]
    docs = db.select("medical_documents")
    summaries = db.select("medical_summaries")
    sos_logs = db.select("audit_logs", {"action": "emergency_sos_triggered"})
    all_logs = db.select("audit_logs")

    return {
        "total_patients": len(patients),
        "total_doctors": len(doctors),
        "total_clinical_sessions": len(sessions),
        "completed_intakes": len(completed),
        "documents_analyzed": len(docs),
        "synthesized_summaries": len(summaries),
        "emergency_sos_triggered": len(sos_logs),
        "total_audit_events": len(all_logs)
    }

@router.get("/audit-logs")
def get_recent_audit_logs(current_user: dict = Depends(get_current_user)):
    """
    Returns recent compliance and security audit logs from Supabase audit_logs table.
    """
    role = current_user.get("role")
    if role not in ["admin", "doctor", "triage"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative authorization required"
        )

    logs = db.select("audit_logs")
    logs.sort(key=lambda x: str(x.get("created_at", "")), reverse=True)
    return logs[:50]
