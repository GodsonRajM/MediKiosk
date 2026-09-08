from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.core.database import db

router = APIRouter(prefix="/timeline", tags=["Medical Timeline"])

@router.get("/{patient_id}")
async def get_patient_timeline(patient_id: str):
    events = [e for e in db.medical_timeline if e["patient_id"] == patient_id]
    # Sort chronologically (latest first)
    sorted_events = sorted(events, key=lambda x: x["event_date"], reverse=True)
    return sorted_events
