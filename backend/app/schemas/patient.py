from pydantic import BaseModel, EmailStr
from typing import Optional, List

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
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: str = "en"
    abha_number: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    medikiosk_id: str
    full_name: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: str
    phone: str
    email: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: str
    identifiers: List[PatientIdentifierSchema] = []
