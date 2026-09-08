import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from app.schemas.interview import QuestionResponse, AnswerSubmission
from app.clinical.question_graph import clinical_graph
from app.safety.red_flag_engine import red_flag_engine
from app.ai.extraction_service import extraction_service
from app.core.database import db

# In-memory interview answers store
session_answers: Dict[str, Dict[str, str]] = {
    "22222222-2222-2222-2222-222222222222": {
        "CHIEF_COMPLAINT": "Chest pain and breathlessness for past 2 days",
        "HPI_DURATION": "1 - 3 days",
        "HPI_ONSET": "Gradually over hours or days",
        "HPI_LOCATION": "Center of chest",
        "HPI_SEVERITY": "6",
        "HPI_CHARACTER": "Heavy pressure / Tightness",
        "HPI_AGGRAVATING": "Walking or physical exertion",
        "HPI_RELIEVING": "Relieved completely by rest (5-10 mins)",
        "HPI_ASSOCIATED": "Shortness of breath",
        "PMH_CONDITIONS": "Diabetes Mellitus, Hypertension",
        "MEDS_CURRENT": "Metformin 500mg, Amlodipine 5mg",
        "ALLERGIES_CHECK": "No known allergies"
    }
}

router = APIRouter(prefix="/interviews", tags=["Clinical Interview Engine"])

@router.get("/{session_id}/next-question", response_model=Dict[str, Any])
async def get_next_question(session_id: str):
    session = db.clinical_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    answers_map = session_answers.get(session_id, {})
    answered_ids = list(answers_map.keys())

    next_q = clinical_graph.get_next_question(
        answered_ids=answered_ids,
        mode=session.get("mode", "STANDARD"),
        language=session.get("selected_language", "en")
    )

    if not next_q:
        return {
            "is_complete": True,
            "message": "Clinical questioning completed",
            "next_step": "DOCUMENTS"
        }

    return {
        "is_complete": False,
        "question": next_q.dict()
    }

@router.post("/{session_id}/answers")
async def submit_answer(session_id: str, ans: AnswerSubmission):
    session = db.clinical_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_id not in session_answers:
        session_answers[session_id] = {}
    session_answers[session_id][ans.question_id] = ans.answer_text

    # If chief complaint, save on session
    if ans.question_id == "CHIEF_COMPLAINT":
        session["chief_complaint_text"] = ans.answer_text

    # Run entity extraction
    extracted = await extraction_service.extract_from_answer(ans.answer_text, ans.question_id)

    # Evaluate safety red flags
    patient_id = session["patient_id"]
    active_flags = red_flag_engine.evaluate_session(
        chief_complaint=session.get("chief_complaint_text", ""),
        answers_map=session_answers[session_id],
        patient_history=["Diabetes", "Hypertension"]
    )

    for flag in active_flags:
        # Check if already present
        exists = any(f["session_id"] == session_id and f["rule_id"] == flag["rule_id"] for f in db.red_flags)
        if not exists:
            flag["session_id"] = session_id
            flag["patient_id"] = patient_id
            db.red_flags.append(flag)

            # Create Triage alert
            db.triage_alerts.append({
                "id": str(uuid.uuid4()),
                "red_flag_id": flag["id"],
                "patient_id": patient_id,
                "patient_name": db.patients.get(patient_id, {}).get("full_name", "Patient"),
                "medikiosk_id": db.patients.get(patient_id, {}).get("medikiosk_id", "MK-000001"),
                "severity": flag["severity"],
                "reason": flag["title"],
                "status": "ACTIVE",
                "action_taken": "Real-time safety trigger dispatched to Triage desk.",
                "created_at": datetime.utcnow().isoformat()
            })

    return {
        "status": "SUCCESS",
        "question_id": ans.question_id,
        "extracted_entities": extracted,
        "active_red_flags_count": len(db.red_flags)
    }
