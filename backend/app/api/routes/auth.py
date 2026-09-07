"""
Authentication and Role Session Routes.
Supports zero-friction Demo Mode for Hackathon evaluation.
"""
from fastapi import APIRouter
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.common import APIResponse
from app.schemas.user import LoginRequest, AuthTokenResponse, UserResponse
from app.db.database import db

router = APIRouter()


@router.post("/auth/login", response_model=APIResponse[AuthTokenResponse])
async def login(req: LoginRequest):
    username = req.username.strip()
    role = req.role or "patient"

    # 1. Demo Mode Fast-Path
    if settings.DEMO_MODE:
        if username.upper() in ["P001", "P-001"]:
            # Demo Patient Murugan
            patient = db.patients.get("11111111-1111-1111-1111-111111111111")
            token = "demo-patient-token-p001"
            user_resp = UserResponse(
                id="patient-p001-uuid",
                role="patient",
                name=patient["name"] if patient else "Murugan S.",
                email=None,
                phone=patient.get("phone") if patient else None,
                created_at="2026-03-01T00:00:00Z"
            )
            return APIResponse(
                success=True,
                data=AuthTokenResponse(
                    access_token=token,
                    user=user_resp,
                    patient_id="11111111-1111-1111-1111-111111111111"
                ),
                message="Demo Patient authenticated"
            )

        if username.upper() in ["DOCTOR001", "DOC001", "DR001"]:
            # Demo Doctor Rajesh
            doc = db.users.get("doctor-001-uuid")
            token = "demo-doctor-token-001"
            user_resp = UserResponse(
                id="doctor-001-uuid",
                role="doctor",
                name=doc["name"] if doc else "Dr. V. Rajesh",
                email="dr.rajesh@ayush.hospital.gov.in",
                phone="+91-9876500001",
                created_at="2026-03-01T00:00:00Z"
            )
            return APIResponse(
                success=True,
                data=AuthTokenResponse(
                    access_token=token,
                    user=user_resp,
                    patient_id=None
                ),
                message="Demo Doctor authenticated"
            )

    # Standard JWT generation fallback
    token = create_access_token({"sub": username, "role": role})
    user_resp = UserResponse(
        id="usr-standard-id",
        role=role,
        name=username,
        created_at="2026-03-01T00:00:00Z"
    )
    return APIResponse(
        success=True,
        data=AuthTokenResponse(access_token=token, user=user_resp),
        message="Authenticated successfully"
    )
