from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import uuid

from app.core.database import db
from app.core.security import get_current_user
from app.schemas.clinical import AnswerSubmissionRequest, ClinicalSessionCreate
from app.clinical.question_graph import clinical_graph
from app.safety.red_flag_engine import red_flag_engine
from app.ai.gemini_service import gemini_service

router = APIRouter(prefix="/interviews", tags=["AI Clinical History Taking"])

@router.post("/start")
def start_interview(payload: ClinicalSessionCreate, current_user: dict = Depends(get_current_user)):
    """
    Initializes a structured clinical intake session and returns the first question from the graph.
    """
    patient_id = current_user.get("sub")
    session_id = payload.session_id or str(uuid.uuid4())
    interview_id = str(uuid.uuid4())

    first_q = clinical_graph.get_first_question()

    existing_sess = db.select_one("clinical_sessions", {"id": session_id})
    if not existing_sess:
        session_record = {
            "id": session_id,
            "patient_id": patient_id,
            "doctor_id": payload.doctor_id,
            "session_status": "in_progress",
            "language": payload.language,
            "started_at": datetime.now(timezone.utc).isoformat()
        }
        db.insert("clinical_sessions", session_record)
    else:
        if payload.doctor_id:
            db.update("clinical_sessions", {"id": session_id}, {"doctor_id": payload.doctor_id})

    interview_record = {
        "id": interview_id,
        "session_id": session_id,
        "patient_id": patient_id,
        "current_node_id": first_q.id,
        "is_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("clinical_interviews", interview_record)

    return {
        "session_id": session_id,
        "interview_id": interview_id,
        "question": first_q.model_dump(),
        "is_completed": False
    }

@router.post("/answer")
def submit_answer(payload: AnswerSubmissionRequest, current_user: dict = Depends(get_current_user)):
    """
    Submits an answer to the current question, extracts structured clinical entities,
    evaluates red-flag triggers, and advances the clinical graph to the next question.
    """
    patient_id = current_user.get("sub")
    session = db.select_one("clinical_sessions", {"id": payload.session_id, "patient_id": patient_id})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active clinical session not found")

    interview = db.select_one("clinical_interviews", {"session_id": payload.session_id})
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview record not found")

    current_q = clinical_graph.get_question_by_id(payload.question_id)
    if not current_q:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown question identifier")

    # 1. AI Entity Extraction
    extracted_entity = gemini_service.extract_clinical_entities(
        question_field=current_q.clinical_field,
        answer_text=payload.answer_text
    )

    # 2. Record answer in Supabase
    ans_id = str(uuid.uuid4())
    ans_record = {
        "id": ans_id,
        "interview_id": interview["id"],
        "question_id": current_q.id,
        "section": current_q.section,
        "question_text": current_q.text.get(payload.language, current_q.text.get("en", "")),
        "answer_text": payload.answer_text,
        "structured_data": extracted_entity,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("clinical_answers", ans_record)

    # 3. Record entity
    entity_record = {
        "id": str(uuid.uuid4()),
        "session_id": payload.session_id,
        "patient_id": patient_id,
        "category": current_q.section,
        "name": current_q.clinical_field,
        "value": extracted_entity.get("value", payload.answer_text),
        "confidence": extracted_entity.get("confidence", 0.95),
        "source": "patient_answer",
        "doctor_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("clinical_entities", entity_record)

    # 4. Fetch all answers so far in this interview
    answers_so_far = db.select("clinical_answers", {"interview_id": interview["id"]})

    # 5. Evaluate real-time red flags
    active_red_flags = red_flag_engine.evaluate(answers_so_far)

    # 6. Determine next question from graph
    next_q = clinical_graph.get_next_question(
        current_question_id=current_q.id,
        answer_value=payload.answer_text,
        answers_so_far=answers_so_far
    )

    if next_q:
        db.update("clinical_interviews", {"id": interview["id"]}, {"current_node_id": next_q.id})
        return {
            "session_id": payload.session_id,
            "interview_id": interview["id"],
            "question": next_q.model_dump(),
            "is_completed": False,
            "red_flags": active_red_flags
        }
    else:
        # Clinical Graph Completed!
        db.update("clinical_interviews", {"id": interview["id"]}, {
            "current_node_id": None,
            "is_completed": True
        })
        db.update("clinical_sessions", {"id": payload.session_id}, {
            "session_status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat()
        })

        # Fetch patient profile and previous history from Supabase
        patient_profile = db.select_one("profiles", {"id": patient_id}) or {}
        prev_history = db.select("medical_history", {"patient_id": patient_id})
        
        # Extracted document entities
        docs = db.select("medical_documents", {"patient_id": patient_id})
        doc_entities = []
        for d in docs:
            ents = db.select("document_entities", {"document_id": d["id"]})
            doc_entities.extend(ents)

        # Synthesize Medical Summary
        summary_content = gemini_service.synthesize_medical_summary(
            patient_profile=patient_profile,
            answers=answers_so_far,
            previous_history=prev_history,
            document_entities=doc_entities
        )

        summary_id = str(uuid.uuid4())
        summary_record = {
            "id": summary_id,
            "session_id": payload.session_id,
            "patient_id": patient_id,
            "doctor_id": session.get("doctor_id"),
            "summary_json": summary_content,
            "red_flags": active_red_flags,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.insert("medical_summaries", summary_record)

        # Update medical timeline
        db.insert("medical_timeline", {
            "patient_id": patient_id,
            "event_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "event_type": "Clinical Intake Summary",
            "title": f"OPD Case Prepared: {summary_content.get('chief_complaint')}",
            "description": "Comprehensive pre-consultation case-taking completed via MediKiosk AI.",
            "source": "summary",
            "source_id": summary_id
        })

        return {
            "session_id": payload.session_id,
            "interview_id": interview["id"],
            "question": None,
            "is_completed": True,
            "summary": summary_record,
            "red_flags": active_red_flags
        }
