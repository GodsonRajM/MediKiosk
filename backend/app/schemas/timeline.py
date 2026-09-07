"""
Medical Timeline Schemas.
"""
from typing import Optional
from pydantic import BaseModel


class TimelineEventBase(BaseModel):
    event_date: str
    event_type: str  # symptom_onset, lab_test, prescription, past_diagnosis, procedure
    title: str
    description: str
    source_type: str  # interview, document, external_record


class TimelineEventCreate(TimelineEventBase):
    patient_id: str
    source_id: Optional[str] = None
    confidence: float = 1.0


class TimelineEventResponse(TimelineEventBase):
    id: str
    patient_id: str
    source_id: Optional[str] = None
    confidence: float
    created_at: str
