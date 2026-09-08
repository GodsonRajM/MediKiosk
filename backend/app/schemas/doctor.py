from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DoctorQueueItem(BaseModel):
    patient_id: str
    medikiosk_id: str
    patient_name: str
    age: int
    gender: str
    chief_complaint: str
    priority: str  # CRITICAL, HIGH, NORMAL
    has_red_flags: bool
    red_flag_count: int
    wait_time_minutes: int
    completion_percentage: int
    session_id: str
    session_status: str

class FieldVerificationRequest(BaseModel):
    field_id: str
    field_type: str  # condition, medication, allergy, investigation, ayush
    action: str      # CONFIRMED, EDITED, REJECTED, ADDED
    doctor_notes: Optional[str] = None
    edited_value: Optional[Dict[str, Any]] = None

class SignOffRequest(BaseModel):
    clinical_notes: str
    provisional_plan: Optional[str] = None

class DoctorReviewResponse(BaseModel):
    id: str
    session_id: str
    patient_id: str
    doctor_id: str
    field_verifications: List[Dict[str, Any]] = []
    clinical_notes: str
    provisional_plan: Optional[str] = None
    verified_at: str
    is_signed_off: bool = True
