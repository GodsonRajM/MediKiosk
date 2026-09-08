from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class RedFlagResponse(BaseModel):
    id: str
    session_id: str
    patient_id: str
    rule_id: str
    severity: str  # LOW, MODERATE, HIGH, CRITICAL
    title: str
    clinical_recommendation: str = "Priority clinical assessment recommended"
    triggered_criteria: List[str] = []
    is_active: bool = True
    created_at: str

class TriageAlertResponse(BaseModel):
    id: str
    red_flag_id: str
    patient_id: str
    patient_name: str
    medikiosk_id: str
    severity: str
    reason: str
    status: str  # ACTIVE, ACKNOWLEDGED, UNDER_REVIEW, ESCALATED, CLOSED
    action_taken: Optional[str] = None
    created_at: str

class TriageActionRequest(BaseModel):
    status: str
    action_taken: str
