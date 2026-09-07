"""
Question and Answer Schemas.
"""
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class QuestionOption(BaseModel):
    id: str
    label: str
    value: str
    icon: Optional[str] = None


class QuestionResponse(BaseModel):
    id: str
    question_code: str
    section: str
    question_text: str
    question_type: str  # single_choice, multi_choice, scale, text, voice
    options: List[QuestionOption] = []
    sequence: int
    required: bool = True
    help_text: Optional[str] = None


class AnswerSubmit(BaseModel):
    question_code: str
    raw_answer: str
    normalized_answer: Optional[str] = None
    input_method: str = Field(..., pattern="^(touch|voice|text)$")
    language: str = "en"
    confidence: float = 1.0


class AnswerResponse(BaseModel):
    id: str
    question_id: str
    interview_id: str
    raw_answer: str
    normalized_answer: Optional[str] = None
    input_method: str
    language: str
    confidence: float
    created_at: str
