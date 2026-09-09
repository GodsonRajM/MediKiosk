from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class PatientSignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)
    age: int = Field(..., ge=1, le=130)
    phone: str = Field(..., min_length=7)
    address: str = Field(..., min_length=3)
    blood_group: Optional[str] = None
    emergency_contact: str = Field(..., min_length=7)
    consent_accepted: bool = Field(..., description="Mandatory consent for clinical intake and data protection")

class DoctorSignupRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: str
    password: str = Field(..., min_length=6)
    age: int = Field(..., ge=18, le=120)
    phone: str = Field(..., min_length=7)
    address: str = Field(..., min_length=3)
    specialization: Optional[str] = "General Medicine"
    blood_group: Optional[str] = None
    emergency_contact: str = Field(..., min_length=5)
    consent_accepted: bool = Field(..., description="Mandatory consent for clinical protocol oversight")

class LoginRequest(BaseModel):
    identifier: str = Field(..., description="Patient ID (MK-XXXXXX), Doctor ID (DK-XXXXXX), or registered Email")
    name: Optional[str] = None
    password: str = Field(..., min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    reset_token: str
    new_password: str = Field(..., min_length=6)

class ConsentSubmissionRequest(BaseModel):
    consent_type: str = "clinical_intake_and_privacy"
    consent_status: str = "granted"
    consent_version: str = "v1.0"
    consent_text: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]
