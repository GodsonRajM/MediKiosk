from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    identifier: str  # MediKiosk ID (MK-P..., MK-D...), Email, or Phone
    password: str
    expected_role: Optional[str] = None  # "PATIENT" or "DOCTOR"

class PatientRegisterRequest(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: str
    password: str
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    gender: str = "Other"
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    preferred_language: str = "en"
    consent_granted: bool = Field(..., description="Mandatory explicit consent for clinical data collection under DPDP / ABDM")

class DoctorRegisterRequest(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    specialization: str
    license_number: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    consent_granted: bool = Field(..., description="Mandatory explicit consent for doctor portal usage and verified EHR access")

class ForgotPasswordRequest(BaseModel):
    identifier: str
    new_password: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp_code: str

class UserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    is_active: bool
