"""
Consent Schemas for Consent-First Patient Rights Architecture.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class ConsentItem(BaseModel):
    consent_type: str = Field(..., pattern="^(clinical_history|voice_processing|document_processing|doctor_sharing|abdm_exchange|research)$")
    status: str = Field("granted", pattern="^(granted|denied|revoked)$")
    language: str = "en"


class ConsentRecordCreate(BaseModel):
    patient_id: str
    session_id: Optional[str] = None
    consents: List[ConsentItem]
    consent_version: str = "v1.0"


class ConsentResponse(BaseModel):
    id: str
    patient_id: str
    consent_type: str
    status: str
    language: str
    consent_version: str
    consented_at: str
