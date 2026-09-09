from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class QuestionResponse(BaseModel):
    question_id: str
    section: str
    question_text: str
    question_text_en: str
    question_text_kn: Optional[str] = None
    question_text_ta: Optional[str] = None
    question_text_hi: Optional[str] = None
    input_type: str  # text, choice, scale, voice
    options: List[str] = []
    is_required: bool = True
    clinical_category: str
    total_nodes: int = 10
    current_index: int = 1

class AnswerSubmission(BaseModel):
    question_id: str
    answer_text: str
    input_method: str = "touch"  # voice, touch, keyboard
    audio_transcript: Optional[str] = None

class EntityExtractionResult(BaseModel):
    entity_type: str
    entity_name: str
    attributes: Dict[str, Any] = {}
    source: str = "PATIENT_INTERVIEW"
    confidence: float = 0.95
