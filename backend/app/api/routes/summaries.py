"""
Clinical Summary and Doctor Verification Routes.
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter
from app.schemas.common import APIResponse
from app.schemas.summary import SummaryResponse, DoctorReviewSubmit
from app.services.summary_service import summary_service
from app.services.audit_service import audit_service

router = APIRouter()


class SummaryGenerateRequest(BaseModel):
    patient_id: str
    interview_id: Optional[str] = None


@router.post("/summaries/generate", response_model=APIResponse[Dict[str, Any]])
async def generate_summary(req: SummaryGenerateRequest):
    summary = await summary_service.generate_summary(req.patient_id, req.interview_id)
    audit_service.log_action(
        action="SUMMARY_GENERATED",
        resource_type="summary",
        resource_id=summary["id"],
        patient_id=req.patient_id
    )
    return APIResponse(success=True, data=summary, message="Clinical pre-consultation summary generated")


@router.get("/summaries/{summary_id}", response_model=APIResponse[Dict[str, Any]])
async def get_summary(summary_id: str):
    summary = summary_service.get_summary_by_id(summary_id)
    return APIResponse(success=True, data=summary)


@router.post("/summaries/{summary_id}/review", response_model=APIResponse[Dict[str, Any]])
async def review_summary(summary_id: str, review_data: DoctorReviewSubmit):
    reviewed = summary_service.review_summary(
        summary_id=summary_id,
        doctor_id=review_data.doctor_id,
        action=review_data.action,
        edited_content=review_data.edited_content,
        comments=review_data.comments
    )
    audit_service.log_action(
        action=f"SUMMARY_{review_data.action.upper()}",
        resource_type="summary",
        resource_id=summary_id,
        user_id=review_data.doctor_id,
        metadata={"action": review_data.action}
    )
    return APIResponse(success=True, data=reviewed, message=f"Summary successfully {review_data.action}ed")
