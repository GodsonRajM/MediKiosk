"""
Clinical Interview Engine.
Coordinates question sequencing, answer intake, entity normalization,
safety red-flag evaluations, and interview progression.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
from app.clinical.question_graph import clinical_graph
from app.clinical.red_flags import red_flag_engine
from app.clinical.entity_extractor import entity_extractor
from app.db.database import db
from app.schemas.question import QuestionResponse


class InterviewEngine:
    """State machine governing patient intake interviews."""

    @staticmethod
    def start_interview(
        patient_id: str,
        chief_complaint: str,
        session_id: Optional[str] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Initializes a new clinical intake interview."""
        interview_id = str(uuid.uuid4())
        pathway = clinical_graph.detect_pathway(chief_complaint)
        now = datetime.now(timezone.utc).isoformat()

        interview_data = {
            "id": interview_id,
            "patient_id": patient_id,
            "session_id": session_id,
            "chief_complaint": chief_complaint,
            "pathway": pathway,
            "status": "in_progress",
            "current_section": "symptom_details",
            "answered_slots": {},
            "red_flags": [],
            "started_at": now,
            "completed_at": None,
            "language": language
        }
        db.interviews[interview_id] = interview_data
        
        # Determine initial question
        first_q = clinical_graph.get_next_question(pathway, {})
        return interview_data, first_q

    @staticmethod
    def process_answer(
        interview_id: str,
        question_code: str,
        raw_answer: str,
        input_method: str = "touch",
        language: str = "en",
        confidence: float = 1.0
    ) -> Tuple[Dict[str, Any], Optional[QuestionResponse], List[Dict[str, Any]]]:
        """Processes patient answer, updates state, evaluates red flags, and determines next step."""
        interview = db.interviews.get(interview_id)
        if not interview:
            raise ValueError(f"Interview {interview_id} not found")

        now = datetime.now(timezone.utc).isoformat()

        # 1. Normalize answer & extract entity
        normalized_info = entity_extractor.normalize_answer(question_code, raw_answer)
        slot_name = normalized_info["slot"]
        normalized_val = normalized_info["normalized"]

        # 2. Update state
        interview["answered_slots"][slot_name] = normalized_val

        # Record answer in DB
        answer_id = str(uuid.uuid4())
        answer_record = {
            "id": answer_id,
            "question_id": question_code,
            "interview_id": interview_id,
            "raw_answer": raw_answer,
            "normalized_answer": str(normalized_val),
            "input_method": input_method,
            "language": language,
            "confidence": confidence,
            "created_at": now
        }
        if interview_id not in db.answers:
            db.answers[interview_id] = []
        db.answers[interview_id].append(answer_record)

        # 3. Evaluate deterministic red flags
        detected_flags = red_flag_engine.evaluate(
            interview["answered_slots"],
            chief_complaint=interview["chief_complaint"]
        )
        interview["red_flags"] = detected_flags
        
        # Save to db.red_flags for patient
        patient_id = interview["patient_id"]
        if detected_flags:
            if patient_id not in db.red_flags:
                db.red_flags[patient_id] = []
            for flag in detected_flags:
                # Avoid duplicate flags by rule_code
                existing = any(f.get("rule_code") == flag["rule_code"] for f in db.red_flags[patient_id])
                if not existing:
                    db.red_flags[patient_id].append({
                        "id": str(uuid.uuid4()),
                        "patient_id": patient_id,
                        "interview_id": interview_id,
                        "rule_code": flag["rule_code"],
                        "severity": flag["severity"],
                        "message": flag["message"],
                        "status": "active",
                        "created_at": now
                    })

        # 4. Determine next question
        next_q = clinical_graph.get_next_question(
            interview["pathway"],
            interview["answered_slots"]
        )

        # 5. Check if complete
        if next_q is None:
            interview["status"] = "completed"
            interview["completed_at"] = now

        return interview, next_q, detected_flags


interview_engine = InterviewEngine()
