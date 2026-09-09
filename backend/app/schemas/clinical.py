from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class QuestionOption(BaseModel):
    id: str
    label: Dict[str, str] = Field(..., description="Multilingual text {en, kn, ta, hi}")
    value: str

class QuestionNode(BaseModel):
    id: str
    section: str
    question_type: str = Field(..., description="single_choice | multi_choice | text | numeric | duration")
    text: Dict[str, str] = Field(..., description="Multilingual text {en, kn, ta, hi}")
    options: Optional[List[QuestionOption]] = None
    required: bool = True
    clinical_field: str
    red_flag_criteria: Optional[List[str]] = None

class AnswerSubmissionRequest(BaseModel):
    session_id: str
    question_id: str
    answer_text: str
    language: str = "en"
    audio_data_base64: Optional[str] = None

class ClinicalSessionCreate(BaseModel):
    session_id: Optional[str] = None
    doctor_id: Optional[str] = None
    language: str = "en"

class MedicalSummaryResponse(BaseModel):
    id: str
    session_id: str
    patient_id: str
    doctor_id: Optional[str] = None
    summary: Dict[str, Any]
    red_flags: List[Dict[str, Any]] = []
    created_at: str

class RedFlagAlert(BaseModel):
    rule_id: str
    level: str = "HIGH"  # HIGH | CRITICAL
    message: str
    symptoms: List[str]
    triage_recommendation: str
