from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional, Dict, Any

from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/summaries", tags=["Medical Summaries"])

@router.get("/latest")
def get_latest_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    summaries = db.select("medical_summaries", {"patient_id": user_id})
    if not summaries:
        return {"summary": None, "red_flags": []}
    
    latest = summaries[-1]
    return {
        "summary": latest.get("summary_json"),
        "red_flags": latest.get("red_flags", []),
        "id": latest.get("id"),
        "created_at": latest.get("created_at")
    }

@router.get("/{summary_id}")
def get_summary_by_id(summary_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    role = current_user.get("role")
    
    summary = db.select_one("medical_summaries", {"id": summary_id})
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found")

    # Authorization
    if role == "patient" and summary.get("patient_id") != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    if role == "doctor":
        # Check doctor authorization for this patient
        rel = db.select_one("doctor_patient_relationships", {
            "doctor_id": user_id,
            "patient_id": summary.get("patient_id"),
            "status": "active"
        })
        if not rel and summary.get("doctor_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor not authorized for this patient's summary")

    return summary
