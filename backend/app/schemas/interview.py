"""
Interview Schemas.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.question import QuestionResponse


class InterviewStart(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    chief_complaint: str = Field(..., min_length=2)
    pathway: Optional[str] = None  # e.g. chest_pain, fever, cough
    language: str = "en"


class InterviewStateResponse(BaseModel):
    id: str
    patient_id: str
    chief_complaint: str
    status: str  # started, in_progress, completed
    current_section: str
    pathway: str
    completed_questions_count: int
    total_estimated_questions: int
    next_question: Optional[QuestionResponse] = None
    red_flags_detected: List[Dict[str, Any]] = []
    is_completed: bool = False
