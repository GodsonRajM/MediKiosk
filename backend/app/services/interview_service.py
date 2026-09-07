"""
Interview Service.
Interacts with the clinical interview engine and question graph.
"""
from typing import Dict, Any, Optional
from app.db.database import db
from app.clinical.interview_engine import interview_engine
from app.clinical.question_graph import clinical_graph
from app.schemas.interview import InterviewStart, InterviewStateResponse
from app.schemas.question import AnswerSubmit


class InterviewService:
    @staticmethod
    def start_interview(data: InterviewStart) -> InterviewStateResponse:
        interview_data, first_q = interview_engine.start_interview(
            patient_id=data.patient_id,
            chief_complaint=data.chief_complaint,
            session_id=data.session_id,
            language=data.language
        )
        total_q = clinical_graph.get_total_questions_count(interview_data["pathway"])

        return InterviewStateResponse(
            id=interview_data["id"],
            patient_id=interview_data["patient_id"],
            chief_complaint=interview_data["chief_complaint"],
            status=interview_data["status"],
            current_section=interview_data["current_section"],
            pathway=interview_data["pathway"],
            completed_questions_count=0,
            total_estimated_questions=total_q,
            next_question=first_q,
            red_flags_detected=[],
            is_completed=False
        )

    @staticmethod
    def submit_answer(interview_id: str, data: AnswerSubmit) -> InterviewStateResponse:
        interview, next_q, red_flags = interview_engine.process_answer(
            interview_id=interview_id,
            question_code=data.question_code,
            raw_answer=data.raw_answer,
            input_method=data.input_method,
            language=data.language,
            confidence=data.confidence
        )
        total_q = clinical_graph.get_total_questions_count(interview["pathway"])
        completed_count = len(interview.get("answered_slots", {}))

        return InterviewStateResponse(
            id=interview["id"],
            patient_id=interview["patient_id"],
            chief_complaint=interview["chief_complaint"],
            status=interview["status"],
            current_section=interview["current_section"],
            pathway=interview["pathway"],
            completed_questions_count=completed_count,
            total_estimated_questions=total_q,
            next_question=next_q,
            red_flags_detected=red_flags,
            is_completed=(next_q is None)
        )

    @staticmethod
    def get_interview(interview_id: str) -> Optional[Dict[str, Any]]:
        return db.interviews.get(interview_id)


interview_service = InterviewService()
