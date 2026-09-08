from pydantic import BaseModel
from typing import Optional, List

class ConsentItem(BaseModel):
    category: str
    status: str = "GRANTED"

class ConsentSubmission(BaseModel):
    consents: List[ConsentItem]
    language: str = "en"
    audio_recorded: bool = False

class SessionCreate(BaseModel):
    patient_id: str
    mode: str = "STANDARD"  # "STANDARD" or "AYUSH"
    selected_language: str = "en"

class SessionResponse(BaseModel):
    id: str
    patient_id: str
    session_status: str
    mode: str
    current_step: str
    selected_language: str
    chief_complaint_text: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None
