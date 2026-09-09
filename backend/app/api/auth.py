import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any, Optional
from app.schemas.auth import (
    Token, LoginRequest, PatientRegisterRequest, DoctorRegisterRequest,
    ForgotPasswordRequest, OTPRequest, OTPVerifyRequest, UserResponse
)
from app.core.database import db
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register/patient", response_model=Token)
async def register_patient(req: PatientRegisterRequest):
    if not req.consent_granted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mandatory consent required: You must explicitly agree to the clinical data collection terms to proceed."
        )

    # Check if user with this phone or email already exists
    for u in db.users.values():
        if (req.email and u.get("email") == req.email) or u.get("phone") == req.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this phone number or email already exists."
            )

    user_id = str(uuid.uuid4())
    patient_id = str(uuid.uuid4())
    medikiosk_id = db.next_patient_id()

    user_record = {
        "id": user_id,
        "email": req.email,
        "phone": req.phone,
        "password_hash": get_password_hash(req.password),
        "role": "PATIENT",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    db.users[user_id] = user_record

    patient_record = {
        "id": patient_id,
        "user_id": user_id,
        "medikiosk_id": medikiosk_id,
        "full_name": req.full_name,
        "date_of_birth": req.date_of_birth,
        "age": req.age,
        "gender": req.gender,
        "phone": req.phone,
        "email": req.email,
        "address": req.address,
        "blood_group": req.blood_group,
        "emergency_contact_name": req.emergency_contact_name,
        "emergency_contact_phone": req.emergency_contact_phone,
        "preferred_language": req.preferred_language or "en",
        "consent_granted": True,
        "consent_timestamp": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    db.patients[patient_id] = patient_record

    # Record internal identifier
    db.patient_identifiers.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "identifier_type": "INTERNAL_MEDIKIOSK_ID",
        "identifier_value": medikiosk_id,
        "issuing_system": "MediKiosk",
        "verified": True
    })

    # Record mandatory consent
    db.consents.append({
        "id": str(uuid.uuid4()),
        "patient_id": patient_id,
        "consent_type": "CLINICAL_INTAKE",
        "status": "GRANTED",
        "version": "1.0",
        "language": req.preferred_language,
        "granted_at": datetime.utcnow().isoformat()
    })

    # Sync to Supabase if configured
    sb = get_supabase_client()
    if sb:
        try:
            sb.table("users").insert(user_record).execute()
            sb.table("patients").insert(patient_record).execute()
        except Exception:
            pass

    token_data = {
        "sub": user_id,
        "email": req.email,
        "role": "PATIENT",
        "patient_id": patient_id,
        "medikiosk_id": medikiosk_id,
        "full_name": req.full_name
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user={
            "id": user_id,
            "patient_id": patient_id,
            "medikiosk_id": medikiosk_id,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "role": "PATIENT",
            "gender": req.gender,
            "age": req.age,
            "address": req.address,
            "blood_group": req.blood_group,
            "preferred_language": req.preferred_language
        }
    )

@router.post("/register/doctor", response_model=Token)
async def register_doctor(req: DoctorRegisterRequest):
    if not req.consent_granted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mandatory consent required: You must explicitly agree to the clinical governance and security terms."
        )

    for u in db.users.values():
        if (req.email and u.get("email") == req.email) or u.get("phone") == req.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email or phone already exists."
            )

    user_id = str(uuid.uuid4())
    doctor_record_id = str(uuid.uuid4())
    doctor_id = db.next_doctor_id()

    user_record = {
        "id": user_id,
        "email": req.email,
        "phone": req.phone,
        "password_hash": get_password_hash(req.password),
        "role": "DOCTOR",
        "is_active": True,
        "created_at": datetime.utcnow().isoformat()
    }
    db.users[user_id] = user_record

    doctor_record = {
        "id": doctor_record_id,
        "user_id": user_id,
        "doctor_id": doctor_id,
        "full_name": req.full_name,
        "email": req.email,
        "phone": req.phone,
        "specialization": req.specialization,
        "license_number": req.license_number,
        "address": req.address,
        "blood_group": req.blood_group,
        "emergency_contact_phone": req.emergency_contact_phone,
        "created_at": datetime.utcnow().isoformat()
    }
    db.doctors[doctor_record_id] = doctor_record

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("users").insert(user_record).execute()
            sb.table("doctors").insert(doctor_record).execute()
        except Exception:
            pass

    token_data = {
        "sub": user_id,
        "email": req.email,
        "role": "DOCTOR",
        "doctor_id": doctor_id,
        "full_name": req.full_name
    }
    token = create_access_token(token_data)

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user={
            "id": user_id,
            "doctor_record_id": doctor_record_id,
            "doctor_id": doctor_id,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "role": "DOCTOR",
            "specialization": req.specialization,
            "address": req.address,
            "blood_group": req.blood_group
        }
    )

@router.post("/login", response_model=Token)
async def login(req: LoginRequest):
    identifier = req.identifier.strip()
    user = None
    patient = None
    doctor = None

    # 1. Search by MediKiosk Patient ID (e.g. MK-P10001)
    for p in db.patients.values():
        if p.get("medikiosk_id") == identifier or (req.expected_role == "PATIENT" and (p.get("email") == identifier or p.get("phone") == identifier)):
            patient = p
            user = db.users.get(p.get("user_id"))
            break

    # 2. Search by Doctor ID (e.g. MK-D10001)
    if not user:
        for d in db.doctors.values():
            if d.get("doctor_id") == identifier or (req.expected_role == "DOCTOR" and (d.get("email") == identifier or d.get("phone") == identifier)):
                doctor = d
                user = db.users.get(d.get("user_id"))
                break

    # 3. Direct user search by email or phone
    if not user:
        for u in db.users.values():
            if u.get("email") == identifier or u.get("phone") == identifier:
                if not req.expected_role or u.get("role") == req.expected_role:
                    user = u
                    break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found. Please verify your ID, Email, or register for a new account."
        )

    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please re-enter your credentials or use Forgot Password."
        )

    # Resolve attached profile
    if not patient and user.get("role") == "PATIENT":
        patient = next((p for p in db.patients.values() if p.get("user_id") == user["id"]), None)

    if not doctor and user.get("role") == "DOCTOR":
        doctor = next((d for d in db.doctors.values() if d.get("user_id") == user["id"]), None)

    token_data = {
        "sub": user["id"],
        "email": user.get("email"),
        "role": user.get("role"),
        "patient_id": patient["id"] if patient else None,
        "medikiosk_id": patient.get("medikiosk_id") if patient else None,
        "doctor_id": doctor.get("doctor_id") if doctor else None,
        "full_name": patient.get("full_name") if patient else (doctor.get("full_name") if doctor else "User")
    }
    token = create_access_token(token_data)

    user_info = {
        "id": user["id"],
        "email": user.get("email"),
        "phone": user.get("phone"),
        "role": user.get("role"),
        "full_name": token_data["full_name"]
    }
    if patient:
        user_info.update({
            "patient_id": patient["id"],
            "medikiosk_id": patient.get("medikiosk_id"),
            "age": patient.get("age"),
            "gender": patient.get("gender"),
            "address": patient.get("address"),
            "blood_group": patient.get("blood_group"),
            "preferred_language": patient.get("preferred_language", "en")
        })
    elif doctor:
        user_info.update({
            "doctor_record_id": doctor["id"],
            "doctor_id": doctor.get("doctor_id"),
            "specialization": doctor.get("specialization"),
            "address": doctor.get("address"),
            "blood_group": doctor.get("blood_group")
        })

    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user=user_info
    )

@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    identifier = req.identifier.strip()
    user = None

    # Match in patients
    for p in db.patients.values():
        if p.get("medikiosk_id") == identifier or p.get("email") == identifier or p.get("phone") == identifier:
            user = db.users.get(p.get("user_id"))
            break

    # Match in doctors
    if not user:
        for d in db.doctors.values():
            if d.get("doctor_id") == identifier or d.get("email") == identifier or d.get("phone") == identifier:
                user = db.users.get(d.get("user_id"))
                break

    # Match in users
    if not user:
        for u in db.users.values():
            if u.get("email") == identifier or u.get("phone") == identifier:
                user = u
                break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account matches the provided identifier."
        )

    user["password_hash"] = get_password_hash(req.new_password)
    return {
        "status": "SUCCESS",
        "message": f"Password reset successfully for account {identifier}. You can now sign in with your new password."
    }

@router.post("/google", response_model=Token)
async def google_auth(payload: Dict[str, Any]):
    email = payload.get("email")
    name = payload.get("name") or "Google User"
    role = payload.get("role", "PATIENT")

    if not email:
        raise HTTPException(status_code=400, detail="Email is required for Google OAuth.")

    # Find or create user
    user = next((u for u in db.users.values() if u.get("email") == email), None)
    if not user:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": email,
            "phone": payload.get("phone", ""),
            "password_hash": get_password_hash(str(uuid.uuid4())),
            "role": role,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat()
        }
        db.users[user_id] = user

        if role == "PATIENT":
            p_id = str(uuid.uuid4())
            mk_id = db.next_patient_id()
            patient_rec = {
                "id": p_id,
                "user_id": user_id,
                "medikiosk_id": mk_id,
                "full_name": name,
                "email": email,
                "phone": "",
                "gender": "Other",
                "preferred_language": "en",
                "consent_granted": True,
                "consent_timestamp": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            db.patients[p_id] = patient_rec
        elif role == "DOCTOR":
            d_id = str(uuid.uuid4())
            doc_id = db.next_doctor_id()
            doctor_rec = {
                "id": d_id,
                "user_id": user_id,
                "doctor_id": doc_id,
                "full_name": name,
                "email": email,
                "phone": "",
                "specialization": "General Physician",
                "created_at": datetime.utcnow().isoformat()
            }
            db.doctors[d_id] = doctor_rec

    token_data = {
        "sub": user["id"],
        "email": email,
        "role": role,
        "full_name": name
    }
    patient = next((p for p in db.patients.values() if p.get("user_id") == user["id"]), None)
    doctor = next((d for d in db.doctors.values() if d.get("user_id") == user["id"]), None)
    if patient:
        token_data["patient_id"] = patient["id"]
        token_data["medikiosk_id"] = patient.get("medikiosk_id")
    if doctor:
        token_data["doctor_id"] = doctor.get("doctor_id")

    token = create_access_token(token_data)
    user_info = {
        "id": user["id"],
        "email": email,
        "role": role,
        "full_name": name,
        "patient_id": patient["id"] if patient else None,
        "medikiosk_id": patient.get("medikiosk_id") if patient else None,
        "doctor_id": doctor.get("doctor_id") if doctor else None
    }
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=3600,
        user=user_info
    )

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    user = db.users.get(current_user["id"])
    if not user:
        return current_user

    patient = next((p for p in db.patients.values() if p.get("user_id") == user["id"]), None)
    doctor = next((d for d in db.doctors.values() if d.get("user_id") == user["id"]), None)

    return {
        "user": user,
        "patient": patient,
        "doctor": doctor
    }
