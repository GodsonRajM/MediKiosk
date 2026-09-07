"""
Patient Schemas.
"""
from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PatientBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    date_of_birth: Optional[date] = None
    age: Optional[int] = Field(None, ge=0, le=130)
    gender: Optional[str] = Field(None, pattern="^(male|female|other|undisclosed)$")
    phone: Optional[str] = None
    abha_id: Optional[str] = None
    preferred_language: str = Field(default="en", min_length=2, max_length=10)


class PatientCreate(PatientBase):
    patient_code: Optional[str] = None  # If not provided, auto-generated


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    abha_id: Optional[str] = None


class PatientResponse(PatientBase):
    id: str
    patient_code: str
    created_at: str
    updated_at: str


class PatientSummaryCard(BaseModel):
    id: str
    patient_code: str
    name: str
    age: Optional[int]
    gender: Optional[str]
    chief_complaint: Optional[str] = None
    red_flag_count: int = 0
    high_severity_flag: bool = False
    status: str = "waiting"
