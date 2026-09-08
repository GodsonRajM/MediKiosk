from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class MedicalConditionSchema(BaseModel):
    id: Optional[str] = None
    patient_id: str
    condition_name: str
    icd10_code: Optional[str] = None
    status: str = "ACTIVE"
    diagnosed_year: Optional[int] = None
    source: str = "PATIENT_INTERVIEW"
    confidence: float = 1.0
    doctor_verified: bool = False

class MedicationSchema(BaseModel):
    id: Optional[str] = None
    patient_id: str
    drug_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: str = "Oral"
    duration: Optional[str] = None
    status: str = "CURRENT"
    source: str = "PATIENT_INTERVIEW"
    confidence: float = 1.0
    doctor_verified: bool = False

class AllergySchema(BaseModel):
    id: Optional[str] = None
    patient_id: str
    allergen: str
    reaction_nature: Optional[str] = None
    severity: str = "MODERATE"
    source: str = "PATIENT_INTERVIEW"
    confidence: float = 1.0
    doctor_verified: bool = False
    contradiction_flag: bool = False
    contradiction_notes: Optional[str] = None

class InvestigationSchema(BaseModel):
    id: Optional[str] = None
    patient_id: str
    test_name: str
    result_value: str
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    is_abnormal: bool = False
    test_date: Optional[str] = None
    source: str = "OCR"
    confidence: float = 1.0
    doctor_verified: bool = False

class TimelineEventSchema(BaseModel):
    id: str
    patient_id: str
    event_date: str
    event_type: str
    title: str
    description: Optional[str] = None
    source: str
    confidence: float = 1.0
    document_id: Optional[str] = None

class EvidenceLink(BaseModel):
    field: str
    source: str
    confidence: float
    reference: str

class LongitudinalSummarySchema(BaseModel):
    id: str
    session_id: str
    patient_id: str
    chief_complaint_summary: str
    hpi_summary: str
    past_history_summary: str
    medications_summary: str
    allergies_summary: str
    investigations_summary: str
    ayush_summary: Optional[str] = None
    contradictions_summary: Optional[str] = None
    red_flags_summary: Optional[str] = None
    evidence_links: List[EvidenceLink] = []
    is_finalized: bool = False
