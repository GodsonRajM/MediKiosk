from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid

from app.core.database import db
from app.core.security import get_current_user
from app.schemas.patient import DoctorConnectRequest

router = APIRouter(prefix="/relationships", tags=["Doctor-Patient Connection"])

@router.post("/connect")
def connect_doctor(payload: DoctorConnectRequest, current_user: dict = Depends(get_current_user)):
    """
    Connects a patient to a doctor by Doctor Name or DK-XXXXXX ID.
    Stores the relationship in Supabase and creates an active clinical session.
    """
    patient_id = current_user.get("sub")
    doctor_profile = None

    if payload.doctor_identifier:
        clean_dk = payload.doctor_identifier.strip().upper()
        doc_id_row = db.select_one("doctor_identifiers", {"doctor_id": clean_dk})
        if doc_id_row:
            doctor_profile = db.select_one("profiles", {"id": doc_id_row["profile_id"]})
    
    if not doctor_profile and payload.doctor_name:
        clean_name = payload.doctor_name.strip().lower()
        all_docs = db.select("profiles", {"role": "doctor"})
        for d in all_docs:
            if clean_name in d["full_name"].lower():
                doctor_profile = d
                break

    if not doctor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found. Please verify the Doctor ID (DK-XXXXXX) or Doctor Name."
        )

    doctor_id = doctor_profile["id"]

    # Check if relationship already exists
    existing_rel = db.select_one("doctor_patient_relationships", {
        "patient_id": patient_id,
        "doctor_id": doctor_id
    })
    
    rel_id = existing_rel["id"] if existing_rel else str(uuid.uuid4())
    if not existing_rel:
        db.insert("doctor_patient_relationships", {
            "id": rel_id,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    else:
        db.update("doctor_patient_relationships", {"id": rel_id}, {"status": "active"})

    # Create / update active clinical session
    session_id = str(uuid.uuid4())
    session_record = {
        "id": session_id,
        "patient_id": patient_id,
        "doctor_id": doctor_id,
        "session_status": "in_progress",
        "started_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("clinical_sessions", session_record)

    did_row = db.select_one("doctor_identifiers", {"profile_id": doctor_id})

    return {
        "status": "connected",
        "relationship_id": rel_id,
        "session_id": session_id,
        "doctor": {
            "id": doctor_id,
            "name": doctor_profile["full_name"],
            "doctor_id": did_row["doctor_id"] if did_row else "DK-000000",
            "specialization": did_row.get("specialization", "General Medicine") if did_row else "General Medicine"
        }
    }

@router.get("/current")
def get_current_connection(current_user: dict = Depends(get_current_user)):
    """
    Returns patient's active connected doctor and session.
    """
    patient_id = current_user.get("sub")
    rel = db.select_one("doctor_patient_relationships", {"patient_id": patient_id, "status": "active"})
    if not rel:
        return {"connected": False, "doctor": None, "session": None}

    doctor_id = rel["doctor_id"]
    doctor_prof = db.select_one("profiles", {"id": doctor_id})
    did_row = db.select_one("doctor_identifiers", {"profile_id": doctor_id})

    # Latest session
    sessions = db.select("clinical_sessions", {"patient_id": patient_id, "doctor_id": doctor_id})
    latest_sess = sessions[-1] if sessions else None

    return {
        "connected": True,
        "doctor": {
            "id": doctor_id,
            "name": doctor_prof["full_name"] if doctor_prof else "Doctor",
            "doctor_id": did_row["doctor_id"] if did_row else "DK-000000",
            "specialization": did_row.get("specialization", "General Medicine") if did_row else "General Medicine"
        },
        "session": latest_sess
    }
