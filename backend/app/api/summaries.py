from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.core.database import db
from app.api.interviews import session_answers
from app.ai.summary_service import summary_service

router = APIRouter(prefix="/summaries", tags=["Longitudinal AI Case Summaries"])

@router.get("/{session_id}")
async def get_case_summary(session_id: str):
    summary = db.summaries.get(session_id)
    if not summary:
        session = db.clinical_sessions.get(session_id, {})
        patient_id = session.get("patient_id")

        answers = session_answers.get(session_id, {})
        conditions = [c for c in db.medical_conditions if c.get("patient_id") == patient_id]
        medications = [m for m in db.medications if m.get("patient_id") == patient_id]
        allergies = [a for a in db.allergies if a.get("patient_id") == patient_id]
        investigations = [i for i in db.investigations if i.get("patient_id") == patient_id]
        documents = [d for d in db.documents if d.get("patient_id") == patient_id]
        red_flags = [f for f in db.red_flags if f.get("session_id") == session_id and f.get("is_active")]

        previous_records = {
            "conditions": conditions,
            "medications": medications,
            "allergies": allergies,
            "investigations": investigations,
            "documents": documents,
            "answers": answers,
            "red_flags": red_flags
        }

        generated = await summary_service.generate_summary(session, previous_records)
        summary = {
            "id": "gen-" + session_id[:8],
            "session_id": session_id,
            "patient_id": patient_id,
            **generated,
            "is_finalized": False
        }
        db.summaries[session_id] = summary
    return summary
