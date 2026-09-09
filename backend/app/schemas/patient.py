from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None

class MedicalHistoryCreate(BaseModel):
    category: str = Field(..., description="condition | surgery | medication | allergy | family | social | investigation")
    title: str = Field(..., min_length=1)
    details: Optional[Dict[str, Any]] = Field(default_factory=dict)
    date_recorded: Optional[str] = None

class MedicalHistoryUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    date_recorded: Optional[str] = None

class DoctorConnectRequest(BaseModel):
    doctor_identifier: Optional[str] = None # DK-XXXXXX
    doctor_name: Optional[str] = None
