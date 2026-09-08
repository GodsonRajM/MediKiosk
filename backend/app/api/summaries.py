from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.core.database import db
from app.ai.summary_service import summary_service

router = APIRouter(prefix="/summaries", tags=["Longitudinal AI Case Summaries"])

@router.get("/{session_id}")
async def get_case_summary(session_id: str):
    summary = db.summaries.get(session_id)
    if not summary:
        session = db.clinical_sessions.get(session_id, {})
        generated = await summary_service.generate_summary(session, {})
        summary = {
            "id": "gen-" + session_id[:8],
            "session_id": session_id,
            "patient_id": session.get("patient_id", "11111111-1111-1111-1111-111111111111"),
            **generated,
            "is_finalized": False
        }
        db.summaries[session_id] = summary
    return summary
