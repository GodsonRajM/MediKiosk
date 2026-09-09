from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import List, Dict, Any
import uuid

from app.core.database import db
from app.core.security import get_current_user
from app.schemas.patient import ProfileUpdateRequest, MedicalHistoryCreate, MedicalHistoryUpdate

router = APIRouter(prefix="/patients", tags=["Patient Portal"])

@router.get("/profile")
def get_patient_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    profile = db.select_one("profiles", {"id": user_id})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    
    clean = dict(profile)
    clean.pop("hashed_password", None)
    
    pid = db.select_one("patient_identifiers", {"profile_id": user_id})
    clean["medikiosk_id"] = pid["medikiosk_id"] if pid else None
    return clean

@router.put("/profile")
def update_patient_profile(payload: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    data_to_update = {k: v for k, v in payload.dict().items() if v is not None}
    
    updated = db.update("profiles", {"id": user_id}, data_to_update)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    res = dict(updated[0])
    res.pop("hashed_password", None)
    return res

@router.get("/history")
def get_patient_history(current_user: dict = Depends(get_current_user)):
    """
    Returns the patient's real medical history from Supabase.
    Zero fake records. Empty array if nothing recorded yet.
    """
    user_id = current_user.get("sub")
    records = db.select("medical_history", {"patient_id": user_id})
    return records

@router.post("/history", status_code=status.HTTP_201_CREATED)
def add_patient_history(payload: MedicalHistoryCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    rec_id = str(uuid.uuid4())
    date_rec = payload.date_recorded or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    rec = {
        "id": rec_id,
        "patient_id": user_id,
        "category": payload.category,
        "title": payload.title,
        "details": payload.details or {},
        "date_recorded": date_rec,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("medical_history", rec)

    # Automatically add to patient's medical timeline
    timeline_item = {
        "patient_id": user_id,
        "event_date": date_rec,
        "event_type": payload.category.capitalize(),
        "title": payload.title,
        "description": f"Recorded {payload.category}: {payload.title}",
        "source": "history",
        "source_id": rec_id
    }
    db.insert("medical_timeline", timeline_item)

    return rec

@router.put("/history/{history_id}")
def update_patient_history(history_id: str, payload: MedicalHistoryUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    rec = db.select_one("medical_history", {"id": history_id, "patient_id": user_id})
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History record not found")

    data_to_update = {k: v for k, v in payload.dict().items() if v is not None}
    updated = db.update("medical_history", {"id": history_id}, data_to_update)
    return updated[0] if updated else rec

@router.delete("/history/{history_id}")
def delete_patient_history(history_id: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    deleted_count = db.delete("medical_history", {"id": history_id, "patient_id": user_id})
    if deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    
    # Also delete corresponding timeline item
    db.delete("medical_timeline", {"source_id": history_id})
    return {"status": "success", "message": "History record removed"}

@router.get("/timeline")
def get_patient_timeline(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    timeline_records = db.select("medical_timeline", {"patient_id": user_id})
    # Sort descending by date
    timeline_records.sort(key=lambda x: str(x.get("event_date", "")), reverse=True)
    return timeline_records
