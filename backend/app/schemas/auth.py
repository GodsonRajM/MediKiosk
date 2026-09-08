from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class LoginRequest(BaseModel):
    identifier: str  # Email, Phone, or MediKiosk ID
    password: str

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
