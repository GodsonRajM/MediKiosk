import uuid
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
from app.schemas.interview import QuestionResponse, AnswerSubmission
from app.clinical.question_graph import clinical_graph
from app.safety.red_flag_engine import red_flag_engine
from app.ai.extraction_service import extraction_service
from app.core.database import db

# Dynamic in-memory interview answers store initialized empty
session_answers: Dict[str, Dict[str, str]] = {}

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

    # Run real extraction
    extracted = await extraction_service.extract_from_answer(ans.answer_text, ans.question_id)

    # Evaluate safety red flags on real answers and real conditions
    patient_id = session.get("patient_id")
    patient_conditions = [c["condition_name"] for c in db.medical_conditions if c.get("patient_id") == patient_id]

    active_flags = red_flag_engine.evaluate_session(
        chief_complaint=session.get("chief_complaint_text", ""),
        answers_map=session_answers[session_id],
        patient_history=patient_conditions
    )

    for flag in active_flags:
        exists = any(f.get("session_id") == session_id and f.get("rule_id") == flag["rule_id"] for f in db.red_flags)
        if not exists:
            flag["session_id"] = session_id
            flag["patient_id"] = patient_id
            db.red_flags.append(flag)

            patient = db.patients.get(patient_id, {})
            db.triage_alerts.append({
                "id": str(uuid.uuid4()),
                "red_flag_id": flag["id"],
                "patient_id": patient_id,
                "patient_name": patient.get("full_name", "Patient"),
                "medikiosk_id": patient.get("medikiosk_id", "MK-P00000"),
                "severity": flag["severity"],
                "reason": flag["title"],
                "status": "ACTIVE",
                "action_taken": "Real-time safety trigger dispatched to Triage desk.",
                "created_at": datetime.utcnow().isoformat()
            })

    # Add to medical timeline
    if ans.question_id == "CHIEF_COMPLAINT":
        db.medical_timeline.append({
            "id": str(uuid.uuid4()),
            "patient_id": patient_id,
            "event_date": datetime.utcnow().strftime("%Y-%m-%d"),
            "event_type": "SYMPTOM",
            "title": f"Chief Complaint: {ans.answer_text[:50]}",
            "description": ans.answer_text,
            "source": "PATIENT_INTERVIEW",
            "confidence": 0.95
        })

    return {
        "status": "SUCCESS",
        "question_id": ans.question_id,
        "extracted_entities": extracted,
        "active_red_flags_count": len([f for f in db.red_flags if f.get("session_id") == session_id])
    }

@router.get("/{session_id}/answers")
async def get_session_answers(session_id: str):
    return session_answers.get(session_id, {})
