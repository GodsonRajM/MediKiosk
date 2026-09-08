from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from app.schemas.auth import Token, LoginRequest, OTPRequest, OTPVerifyRequest, UserResponse
from app.core.database import db
from app.core.security import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(req: LoginRequest):
    identifier = req.identifier.strip()
    
    # 1. Search users by email or phone
    user = None
    for u in db.users.values():
        if u.get("email") == identifier or u.get("phone") == identifier:
            user = u
            break
            
    # 2. Or search by MediKiosk ID
    if not user:
        for p in db.patients.values():
            if p.get("medikiosk_id") == identifier:
                user = db.users.get(p.get("user_id"))
                break

    if not user or not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Check your MediKiosk ID, email, or password."
        )

    # Find associated patient record if applicable
    patient_id = None
    medikiosk_id = None
    for p in db.patients.values():
        if p.get("user_id") == user["id"]:
            patient_id = p["id"]
            medikiosk_id = p["medikiosk_id"]
            break

    token_data = {
        "sub": user["id"],
        "email": user.get("email"),
        "role": user.get("role"),
        "patient_id": patient_id
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user={
            "id": user["id"],
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role"),
            "patient_id": patient_id,
            "medikiosk_id": medikiosk_id
        }
    )

@router.post("/otp/send")
async def send_otp(req: OTPRequest):
    return {"status": "SUCCESS", "message": f"Demo OTP sent to {req.phone}. Use '123456' to verify."}

@router.post("/otp/verify", response_model=Token)
async def verify_otp(req: OTPVerifyRequest):
    if req.otp_code not in ["123456", "000000"]:
        raise HTTPException(status_code=400, detail="Invalid OTP code. For demo, use 123456.")

    # Match patient or return demo patient
    patient = list(db.patients.values())[0]
    user = db.users.get(patient["user_id"])

    token_data = {
        "sub": user["id"],
        "email": user.get("email"),
        "role": user.get("role"),
        "patient_id": patient["id"]
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user={
            "id": user["id"],
            "email": user.get("email"),
            "phone": user.get("phone"),
            "role": user.get("role"),
            "patient_id": patient["id"],
            "medikiosk_id": patient["medikiosk_id"]
        }
    )

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
