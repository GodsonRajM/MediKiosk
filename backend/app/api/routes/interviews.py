"""
Clinical Interview & Question Navigation Routes.
"""
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.schemas.interview import InterviewStart, InterviewStateResponse
from app.schemas.question import AnswerSubmit
from app.services.interview_service import interview_service
from app.services.consent_service import consent_service
from app.services.audit_service import audit_service
from app.core.exceptions import MediKioskException

router = APIRouter()


@router.post("/interviews", response_model=APIResponse[InterviewStateResponse])
async def start_interview(data: InterviewStart):
    # Verify clinical_history consent exists
    consent_service.verify_consent(data.patient_id, "clinical_history")

    interview_state = interview_service.start_interview(data)
    audit_service.log_action(
        action="INTERVIEW_STARTED",
        resource_type="interview",
        resource_id=interview_state.id,
        patient_id=data.patient_id
    )
    return APIResponse(success=True, data=interview_state, message="Clinical interview initiated")


@router.get("/interviews/{interview_id}", response_model=APIResponse[InterviewStateResponse])
async def get_interview_state(interview_id: str):
    interview = interview_service.get_interview(interview_id)
    if not interview:
        raise MediKioskException("Interview session not found", status_code=404, error_code="INTERVIEW_NOT_FOUND")

    from app.clinical.question_graph import clinical_graph
    next_q = clinical_graph.get_next_question(interview["pathway"], interview.get("answered_slots", {}))
    total_q = clinical_graph.get_total_questions_count(interview["pathway"])

    state = InterviewStateResponse(
        id=interview["id"],
        patient_id=interview["patient_id"],
        chief_complaint=interview["chief_complaint"],
        status=interview["status"],
        current_section=interview["current_section"],
        pathway=interview["pathway"],
        completed_questions_count=len(interview.get("answered_slots", {})),
        total_estimated_questions=total_q,
        next_question=next_q,
        red_flags_detected=interview.get("red_flags", []),
        is_completed=(next_q is None)
    )
    return APIResponse(success=True, data=state)


@router.post("/interviews/{interview_id}/answers", response_model=APIResponse[InterviewStateResponse])
async def submit_answer(interview_id: str, answer_data: AnswerSubmit):
    updated_state = interview_service.submit_answer(interview_id, answer_data)
    audit_service.log_action(
        action="ANSWER_SUBMITTED",
        resource_type="interview",
        resource_id=interview_id,
        patient_id=updated_state.patient_id,
        metadata={"question_code": answer_data.question_code, "method": answer_data.input_method}
    )
    return APIResponse(success=True, data=updated_state, message="Answer processed successfully")
