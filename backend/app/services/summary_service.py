"""
Clinical Summary and Doctor Review Service.
Manages AI pre-consultation summary generation, doctor verification, edits, and rejections.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.db.database import db
from app.ai.summarization import summarization_service
from app.core.exceptions import MediKioskException


class SummaryService:
    @staticmethod
    async def generate_summary(patient_id: str, interview_id: Optional[str] = None) -> Dict[str, Any]:
        patient = db.patients.get(patient_id)
        if not patient:
            raise MediKioskException("Patient not found", status_code=404, error_code="PATIENT_NOT_FOUND")

        # Find interview data if available
        interview = db.interviews.get(interview_id) if interview_id else None
        if not interview:
            # Look for any interview of this patient
            for _, inv in db.interviews.items():
                if inv.get("patient_id") == patient_id:
                    interview = inv
                    break
        interview_data = interview or {"chief_complaint": "Clinical intake review"}

        # Document entities
        docs = [d for _, d in db.documents.items() if d.get("patient_id") == patient_id]
        doc_entities = []
        for d in docs:
            doc_entities.extend(d.get("entities", []))

        # Generate via AI Provider
        summary_content = await summarization_service.generate_summary(
            patient_data=patient,
            interview_data=interview_data,
            document_entities=doc_entities
        )

        now = datetime.now(timezone.utc).isoformat()
        summary_id = str(uuid.uuid4())
        summary_record = {
            "id": summary_id,
            "patient_id": patient_id,
            "interview_id": interview.get("id") if interview else None,
            "content": summary_content,
            "status": "under_review",
            "ai_generated": True,
            "doctor_verified": False,
            "created_at": now,
            "updated_at": now
        }
        db.summaries[summary_id] = summary_record
        return summary_record

    @staticmethod
    def get_summary_by_id(summary_id: str) -> Dict[str, Any]:
        summary = db.summaries.get(summary_id)
        if not summary:
            # Check by patient_id
            for _, s in db.summaries.items():
                if s.get("patient_id") == summary_id:
                    return s
            raise MediKioskException("Summary not found", status_code=404, error_code="SUMMARY_NOT_FOUND")
        return summary

    @staticmethod
    def review_summary(
        summary_id: str,
        doctor_id: str,
        action: str,  # confirm, edit, reject
        edited_content: Optional[Dict[str, Any]] = None,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        summary = SummaryService.get_summary_by_id(summary_id)
        now = datetime.now(timezone.utc).isoformat()

        # Update summary status
        if action == "confirm":
            summary["status"] = "verified"
            summary["doctor_verified"] = True
        elif action == "edit":
            summary["status"] = "verified"
            summary["doctor_verified"] = True
            if edited_content:
                summary["content"] = edited_content
        elif action == "reject":
            summary["status"] = "rejected"
            summary["doctor_verified"] = False

        summary["updated_at"] = now

        # Record doctor review
        review_record = {
            "id": str(uuid.uuid4()),
            "summary_id": summary["id"],
            "doctor_id": doctor_id,
            "action": action,
            "edited_content": edited_content,
            "comments": comments,
            "created_at": now
        }
        if summary["id"] not in db.doctor_reviews:
            db.doctor_reviews[summary["id"]] = []
        db.doctor_reviews[summary["id"]].append(review_record)

        return summary


summary_service = SummaryService()
