import uuid
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime
from app.schemas.session import SessionCreate, SessionResponse, ConsentSubmission
from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/sessions", tags=["Clinical Sessions"])

@router.post("", response_model=SessionResponse)
@router.post("/start", response_model=SessionResponse)
async def create_session(req: SessionCreate):
    session_id = str(uuid.uuid4())
    lang = req.preferred_language or req.selected_language
    session_data = {
        "id": session_id,
        "patient_id": req.patient_id,
        "session_status": "CONSENT_PENDING",
        "mode": req.mode.upper(),
        "current_step": "CONSENT",
        "selected_language": lang,
        "chief_complaint_text": None,
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None
    }
    db.clinical_sessions[session_id] = session_data
    return SessionResponse(**session_data)

@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    session = db.clinical_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionResponse(**session)

@router.post("/{session_id}/consent")
async def record_consent(session_id: str, submission: ConsentSubmission):
    session = db.clinical_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    patient_id = session["patient_id"]
    for c in submission.consents:
        db.consents.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "session_id": session_id,
            "consent_type": c.category,
            "status": c.status,
            "version": "1.0",
            "language": submission.language,
            "audio_confirmation_recorded": submission.audio_recorded,
            "created_at": datetime.utcnow().isoformat()
        })

    session["session_status"] = "IN_PROGRESS"
    session["current_step"] = "CHIEF_COMPLAINT"
    session["selected_language"] = submission.language

    # Audit log
    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "session_id": session_id,
        "action_type": "CONSENT_GRANTED",
        "resource_accessed": "PATIENT_CONSENT_ARTIFACT",
        "created_at": datetime.utcnow().isoformat()
    })

    return {"status": "SUCCESS", "message": "Consent recorded and session advanced to Chief Complaint"}
