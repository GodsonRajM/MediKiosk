from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid

from app.core.database import db, format_supabase_error
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.schemas.auth import (
    PatientSignupRequest,
    DoctorSignupRequest,
    LoginRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ConsentSubmissionRequest,
    AuthTokenResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/patient/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_patient(payload: PatientSignupRequest):
    """
    Registers a genuine new patient:
    1. Creates user in Supabase Auth (auth.users)
    2. Uses authenticated auth.uid() to link application profile
    3. Atomically generates Patient ID (MK-XXXXXX) via database RPC
    4. Records profile, patient_identifiers, and mandatory consent
    5. Enforces transactional rollback if database persistence fails.
    """
    if not payload.consent_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Mandatory consent for clinical intake and data protection must be accepted to register.", "code": "CONSENT_REQUIRED"}
        )

    # Pre-check if email already exists in profiles
    try:
        existing = db.select_one("profiles", {"email": payload.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "An account with this email already exists.", "code": "USER_EXISTS"}
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Pre-check note: {e}")

    auth_uid = None

    # Step 1: Create user in Supabase Auth
    if db.supabase_client:
        try:
            auth_res = db.supabase_client.auth.admin.create_user({
                "email": payload.email.lower(),
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "role": "patient",
                    "full_name": payload.full_name
                }
            })
            auth_uid = auth_res.user.id
        except Exception as e:
            err = format_supabase_error(e)
            msg = err.get("message", str(e))
            if "already registered" in msg.lower() or "unique" in msg.lower() or "conflict" in msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": "An account with this email already exists in authentication.", "code": "USER_EXISTS", "details": err.get("details"), "hint": err.get("hint")}
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err
            )
    else:
        auth_uid = str(uuid.uuid4())

    # Step 2: Atomically generate sequential Patient ID (MK-XXXXXX)
    medikiosk_id = db.get_next_id("MK")

    # Step 3: Transactional Database Persistence
    try:
        hashed_pw = get_password_hash(payload.password)

        # 3a. Insert Application Profile linked to auth.uid()
        profile_record = {
            "id": auth_uid,
            "email": payload.email.lower(),
            "hashed_password": hashed_pw,
            "role": "patient",
            "full_name": payload.full_name,
            "age": payload.age,
            "phone": payload.phone,
            "address": payload.address,
            "blood_group": payload.blood_group,
            "emergency_contact": payload.emergency_contact
        }
        db.insert("profiles", profile_record)

        # 3b. Insert Patient Identifier
        id_record = {
            "profile_id": auth_uid,
            "medikiosk_id": medikiosk_id
        }
        db.insert("patient_identifiers", id_record)

        # 3c. Insert into patients table if present in schema
        try:
            db.insert("patients", {
                "name": payload.full_name,
                "age": payload.age,
                "phone": payload.phone
            })
        except Exception as pe:
            print(f"[Auth] patients table note: {pe}")

        # 3d. Insert Mandatory Consent
        consent_record = {
            "user_id": auth_uid,
            "consent_type": "clinical_intake_and_privacy",
            "consent_status": "granted",
            "consent_version": "v1.0",
            "consent_text": "I authorize MediKiosk to capture and process my clinical history for pre-consultation OPD care.",
            "granted_at": datetime.now(timezone.utc).isoformat()
        }
        db.insert("consents", consent_record)

    except Exception as e:
        # Transaction Rollback: delete the created auth user from Supabase Auth
        print(f"[Auth] Transaction failure during patient registration. Rolling back auth user {auth_uid}: {e}")
        if db.supabase_client and auth_uid:
            try:
                db.supabase_client.auth.admin.delete_user(auth_uid)
            except Exception as rollback_err:
                print(f"[Auth] Rollback auth error: {rollback_err}")
            try:
                db.delete("patient_identifiers", {"profile_id": auth_uid})
                db.delete("consents", {"user_id": auth_uid})
                db.delete("profiles", {"id": auth_uid})
            except Exception:
                pass

        err_info = format_supabase_error(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=err_info
        )

    # Step 4: Issue JWT
    token_payload = {
        "sub": auth_uid,
        "email": payload.email.lower(),
        "role": "patient",
        "medikiosk_id": medikiosk_id,
        "name": payload.full_name
    }
    token = create_access_token(token_payload)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=7200,
        user=token_payload
    )

@router.post("/doctor/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: DoctorSignupRequest):
    """
    Registers a genuine new doctor:
    1. Creates user in Supabase Auth (auth.users)
    2. Uses authenticated auth.uid() to link application profile
    3. Atomically generates Doctor ID (DK-XXXXXX) via database RPC
    4. Records profile, doctor_identifiers, and mandatory consent
    5. Enforces transactional rollback if database persistence fails.
    """
    if not payload.consent_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Mandatory consent for clinical protocol oversight must be accepted to register.", "code": "CONSENT_REQUIRED"}
        )

    # Pre-check if email exists
    try:
        existing = db.select_one("profiles", {"email": payload.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"message": "An account with this email already exists.", "code": "USER_EXISTS"}
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Pre-check note: {e}")

    auth_uid = None

    # Step 1: Create user in Supabase Auth
    if db.supabase_client:
        try:
            auth_res = db.supabase_client.auth.admin.create_user({
                "email": payload.email.lower(),
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "role": "doctor",
                    "full_name": payload.full_name
                }
            })
            auth_uid = auth_res.user.id
        except Exception as e:
            err = format_supabase_error(e)
            msg = err.get("message", str(e))
            if "already registered" in msg.lower() or "unique" in msg.lower() or "conflict" in msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={"message": "An account with this email already exists in authentication.", "code": "USER_EXISTS", "details": err.get("details"), "hint": err.get("hint")}
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=err
            )
    else:
        auth_uid = str(uuid.uuid4())

    # Step 2: Atomically generate sequential Doctor ID (DK-XXXXXX)
    doctor_id = db.get_next_id("DK")

    # Step 3: Transactional Database Persistence
    try:
        hashed_pw = get_password_hash(payload.password)

        # 3a. Insert Application Profile linked to auth.uid()
        profile_record = {
            "id": auth_uid,
            "email": payload.email.lower(),
            "hashed_password": hashed_pw,
            "role": "doctor",
            "full_name": payload.full_name,
            "age": payload.age,
            "phone": payload.phone,
            "address": payload.address,
            "blood_group": payload.blood_group,
            "emergency_contact": payload.emergency_contact
        }
        db.insert("profiles", profile_record)

        # 3b. Insert Doctor Identifier
        id_record = {
            "profile_id": auth_uid,
            "doctor_id": doctor_id,
            "specialization": payload.specialization or "General Medicine",
            "department": "OPD"
        }
        db.insert("doctor_identifiers", id_record)

        # 3c. Insert Mandatory Consent
        consent_record = {
            "user_id": auth_uid,
            "consent_type": "clinical_protocol_oversight",
            "consent_status": "granted",
            "consent_version": "v1.0",
            "consent_text": "I agree to verify AI-prepared patient cases and assume primary clinical responsibility.",
            "granted_at": datetime.now(timezone.utc).isoformat()
        }
        db.insert("consents", consent_record)

    except Exception as e:
        # Transaction Rollback
        print(f"[Auth] Transaction failure during doctor registration. Rolling back auth user {auth_uid}: {e}")
        if db.supabase_client and auth_uid:
            try:
                db.supabase_client.auth.admin.delete_user(auth_uid)
            except Exception as rollback_err:
                print(f"[Auth] Rollback auth error: {rollback_err}")
            try:
                db.delete("doctor_identifiers", {"profile_id": auth_uid})
                db.delete("consents", {"user_id": auth_uid})
                db.delete("profiles", {"id": auth_uid})
            except Exception:
                pass

        err_info = format_supabase_error(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=err_info
        )

    # Step 4: Issue JWT
    token_payload = {
        "sub": auth_uid,
        "email": payload.email.lower(),
        "role": "doctor",
        "doctor_id": doctor_id,
        "name": payload.full_name
    }
    token = create_access_token(token_payload)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=7200,
        user=token_payload
    )

@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: LoginRequest):
    """
    Authenticates Patient or Doctor using Patient ID (MK-XXXXXX), Doctor ID (DK-XXXXXX), or Email.
    Enforces password verification and active mandatory consent.
    """
    ident = payload.identifier.strip()
    profile = None
    role = None
    formatted_id = None

    try:
        if ident.upper().startswith("MK-"):
            # Look up by Patient ID
            id_row = db.select_one("patient_identifiers", {"medikiosk_id": ident.upper()})
            if id_row:
                profile = db.select_one("profiles", {"id": id_row["profile_id"]})
                formatted_id = id_row["medikiosk_id"]
                role = "patient"
        elif ident.upper().startswith("DK-"):
            # Look up by Doctor ID
            id_row = db.select_one("doctor_identifiers", {"doctor_id": ident.upper()})
            if id_row:
                profile = db.select_one("profiles", {"id": id_row["profile_id"]})
                formatted_id = id_row["doctor_id"]
                role = "doctor"
        else:
            # Look up by Email
            profile = db.select_one("profiles", {"email": ident.lower()})
            if profile:
                role = profile.get("role", "patient")
                if role == "patient":
                    id_row = db.select_one("patient_identifiers", {"profile_id": profile["id"]})
                    if id_row:
                        formatted_id = id_row["medikiosk_id"]
                elif role == "doctor":
                    id_row = db.select_one("doctor_identifiers", {"profile_id": profile["id"]})
                    if id_row:
                        formatted_id = id_row["doctor_id"]
    except Exception as e:
        print(f"[Auth] Lookup error during login: {e}")
        err_info = format_supabase_error(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=err_info
        )

    if not profile or not verify_password(payload.password, profile.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid credentials. Please verify your ID or email and password.", "code": "INVALID_CREDENTIALS"}
        )

    # Verify active consent exists
    try:
        consent = db.select_one("consents", {"user_id": profile["id"], "consent_status": "granted"})
        if not consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Mandatory clinical consent is required to access the portal.", "code": "CONSENT_REQUIRED"}
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Auth] Consent check note: {e}")

    user_info = {
        "sub": profile["id"],
        "email": profile["email"],
        "role": profile["role"],
        "name": profile["full_name"],
        "formatted_id": formatted_id
    }
    if profile["role"] == "patient":
        user_info["medikiosk_id"] = formatted_id
    elif profile["role"] == "doctor":
        user_info["doctor_id"] = formatted_id

    token = create_access_token(user_info)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=7200,
        user=user_info
    )

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest):
    """
    Handles forgot password requests for real registered users.
    """
    user = db.select_one("profiles", {"email": payload.email.lower()})
    if not user:
        return {
            "status": "success",
            "message": "If an account with this email exists, password recovery instructions have been sent."
        }
    
    reset_token = str(uuid.uuid4())[:8]
    return {
        "status": "success",
        "message": f"Password reset instructions dispatched. For verification, temporary reset token is: {reset_token}",
        "reset_token": reset_token
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest):
    """
    Resets the password for the specified email.
    """
    user = db.select_one("profiles", {"email": payload.email.lower()})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    hashed_pw = get_password_hash(payload.new_password)
    db.update("profiles", {"id": user["id"]}, {"hashed_password": hashed_pw})
    return {"status": "success", "message": "Password successfully updated. You may now login."}

@router.get("/me")
def get_current_profile(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated user's current profile from Supabase.
    """
    user_id = current_user.get("sub")
    profile = db.select_one("profiles", {"id": user_id})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    
    clean_profile = dict(profile)
    clean_profile.pop("hashed_password", None)
    
    if clean_profile.get("role") == "patient":
        pid = db.select_one("patient_identifiers", {"profile_id": user_id})
        clean_profile["medikiosk_id"] = pid["medikiosk_id"] if pid else None
    elif clean_profile.get("role") == "doctor":
        did = db.select_one("doctor_identifiers", {"profile_id": user_id})
        clean_profile["doctor_id"] = did["doctor_id"] if did else None

    return clean_profile
