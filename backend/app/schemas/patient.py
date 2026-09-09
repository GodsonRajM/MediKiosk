from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class PatientIdentifierSchema(BaseModel):
    id: Optional[str] = None
    identifier_type: str
    identifier_value: str
    issuing_system: str = "MediKiosk"
    verified: bool = True

class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: str = "en"
    abha_number: Optional[str] = None

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: Optional[str] = None

class MedicalRecordCreate(BaseModel):
    record_type: str  # "PRESCRIPTION", "LAB_TEST", "SCAN_REPORT", "DISCHARGE_SUMMARY"
    title: str
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    ocr_extracted_text: Optional[str] = None
    date_recorded: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    medikiosk_id: str
    full_name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: str
    identifiers: List[PatientIdentifierSchema] = []
