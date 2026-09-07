"""
User and Authentication Schemas.
"""
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    role: str  # patient, doctor, admin
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None


class UserResponse(UserBase):
    id: str
    created_at: str


class LoginRequest(BaseModel):
    username: str  # Patient code or doctor ID
    password: Optional[str] = None
    role: Optional[str] = "patient"


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    patient_id: Optional[str] = None
