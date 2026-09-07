"""
Clinical Summary and Doctor Review Schemas.
"""
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class RedFlagResponse(BaseModel):
    id: str
    patient_id: str
    rule_code: str
    severity: str  # high, medium, low
    message: str
    status: str
    created_at: str


class AyushProfileSchema(BaseModel):
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    agni: Optional[str] = None
    koshtha: Optional[str] = None
    sara: Optional[str] = None
    ahara_shakti: Optional[str] = None
    vyayama_shakti: Optional[str] = None
    vihara: Optional[str] = None


class SummaryContentSchema(BaseModel):
    chief_complaint: str
    hpi: str
    known_conditions: List[str] = []
    current_medications: List[str] = []
    recent_investigations: List[str] = []
    ayush_assessment: Optional[Dict[str, Any]] = None
    risk_stratification: Optional[str] = None


class SummaryResponse(BaseModel):
    id: str
    patient_id: str
    interview_id: Optional[str]
    content: Dict[str, Any]
    status: str  # draft, under_review, verified, rejected
    ai_generated: bool
    doctor_verified: bool
    created_at: str
    updated_at: str


class DoctorReviewSubmit(BaseModel):
    doctor_id: str
    action: str = Field(..., pattern="^(confirm|edit|reject)$")
    edited_content: Optional[Dict[str, Any]] = None
    comments: Optional[str] = None
