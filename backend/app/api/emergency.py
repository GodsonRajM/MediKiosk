import hmac
import hashlib
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import db
from app.core.security import get_current_user

router = APIRouter(prefix="/emergency", tags=["Emergency Medical Portal & SOS"])

# In-memory rate limiting for SOS triggers (token/IP -> timestamp)
_SOS_RATE_LIMIT: Dict[str, float] = {}

class SOSTriggerRequest(BaseModel):
    token: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None

class EmergencySettingsUpdate(BaseModel):
    is_enabled: bool
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    special_instructions: Optional[str] = None

def generate_emergency_token(patient_id: str) -> str:
    """Generates a secure, URL-safe 32-character HMAC token for a patient."""
    secret = settings.SECRET_KEY.encode()
    msg = f"medikiosk:emergency:{patient_id}".encode()
    return hmac.new(secret, msg, hashlib.sha256).hexdigest()[:32]

def resolve_patient_from_token(token: str) -> Optional[Dict[str, Any]]:
    """Resolves patient profile corresponding to the given HMAC emergency token."""
    # Find patient by scanning profiles
    patients = db.select("profiles", {"role": "patient"})
    for p in patients:
        expected = generate_emergency_token(p["id"])
        if hmac.compare_digest(expected, token):
            return p
    return None

@router.get("/settings")
def get_emergency_settings(current_user: dict = Depends(get_current_user)):
    """
    Returns the authenticated patient's emergency access card details,
    including the active emergency token, public URL, and emergency summary.
    """
    patient_id = current_user.get("sub")
    profile = db.select_one("profiles", {"id": patient_id})
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    pid_row = db.select_one("patient_identifiers", {"profile_id": patient_id})
    token = generate_emergency_token(patient_id)

    # Check toggle status from audit_logs or default to true
    toggle_logs = db.select("audit_logs", {
        "user_id": patient_id,
        "action": "emergency_access_toggle"
    })
    is_enabled = True
    if toggle_logs:
        latest = toggle_logs[-1]
        is_enabled = latest.get("details", {}).get("is_enabled", True)

    # Gather medical history highlights
    history = db.select("medical_history", {"patient_id": patient_id})
    allergies = [h["title"] for h in history if h.get("category") == "allergy"]
    conditions = [h["title"] for h in history if h.get("category") == "condition"]
    medications = [h["title"] for h in history if h.get("category") == "medication"]

    return {
        "token": token,
        "is_enabled": is_enabled,
        "medikiosk_id": pid_row["medikiosk_id"] if pid_row else "PS000000",
        "full_name": profile.get("full_name"),
        "age": profile.get("age"),
        "blood_group": profile.get("blood_group") or "Not Specified",
        "emergency_contact": profile.get("emergency_contact") or "Not Specified",
        "phone": profile.get("phone"),
        "allergies": allergies,
        "conditions": conditions,
        "medications": medications
    }

@router.post("/toggle")
def toggle_emergency_access(payload: EmergencySettingsUpdate, current_user: dict = Depends(get_current_user)):
    """
    Allows a patient to activate or deactivate their public emergency access card.
    """
    patient_id = current_user.get("sub")
    
    # Update profile fields if blood group or emergency contact updated
    profile_updates = {}
    if payload.blood_group is not None:
        profile_updates["blood_group"] = payload.blood_group
    if payload.emergency_contact is not None:
        profile_updates["emergency_contact"] = payload.emergency_contact
    if profile_updates:
        db.update("profiles", {"id": patient_id}, profile_updates)

    # Record toggle state in audit log
    db.insert("audit_logs", {
        "id": str(uuid.uuid4()),
        "user_id": patient_id,
        "action": "emergency_access_toggle",
        "resource_type": "emergency_portal",
        "resource_id": patient_id,
        "details": {
            "is_enabled": payload.is_enabled,
            "special_instructions": payload.special_instructions
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"status": "success", "is_enabled": payload.is_enabled}

@router.get("/view/{token}")
def public_emergency_view(token: str, request: Request):
    """
    Public emergency access endpoint. No authentication required.
    Allows paramedics, first responders, or emergency staff to read critical health facts.
    """
    patient = resolve_patient_from_token(token)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or expired emergency medical token."
        )

    patient_id = patient["id"]

    # Check if patient has disabled emergency access
    toggle_logs = db.select("audit_logs", {
        "user_id": patient_id,
        "action": "emergency_access_toggle"
    })
    if toggle_logs:
        latest = toggle_logs[-1]
        if not latest.get("details", {}).get("is_enabled", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Emergency access has been disabled by the patient."
            )

    pid_row = db.select_one("patient_identifiers", {"profile_id": patient_id})
    history = db.select("medical_history", {"patient_id": patient_id})
    allergies = [h["title"] for h in history if h.get("category") == "allergy"]
    conditions = [h["title"] for h in history if h.get("category") == "condition"]
    medications = [h["title"] for h in history if h.get("category") == "medication"]

    client_ip = request.client.host if request.client else "unknown"

    # Audit log emergency access for patient security
    try:
        db.insert("audit_logs", {
            "id": str(uuid.uuid4()),
            "user_id": patient_id,
            "action": "emergency_portal_accessed",
            "resource_type": "emergency_token",
            "resource_id": token[:10] + "...",
            "ip_address": client_ip,
            "details": {"timestamp": datetime.now(timezone.utc).isoformat()},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    except Exception:
        pass

    return {
        "status": "active",
        "medikiosk_id": pid_row["medikiosk_id"] if pid_row else "PS000000",
        "full_name": patient.get("full_name"),
        "age": patient.get("age"),
        "blood_group": patient.get("blood_group") or "Unknown",
        "emergency_contact": patient.get("emergency_contact") or "Not registered",
        "phone": patient.get("phone"),
        "allergies": allergies,
        "conditions": conditions,
        "medications": medications,
        "verified_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    }

@router.post("/sos")
def trigger_emergency_sos(payload: SOSTriggerRequest, request: Request):
    """
    Rate-limited SOS trigger endpoint.
    Notifies hospital triage and logs immediate critical emergency event with GPS coordinates.
    """
    patient = resolve_patient_from_token(payload.token)
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid emergency medical token."
        )

    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{payload.token}:{client_ip}"
    now_ts = time.time()

    # Rate limiting: max 1 trigger per 30 seconds per token/IP
    if rate_key in _SOS_RATE_LIMIT and (now_ts - _SOS_RATE_LIMIT[rate_key]) < 30:
        remaining = int(30 - (now_ts - _SOS_RATE_LIMIT[rate_key]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Emergency SOS recently dispatched. Please wait {remaining} seconds before re-triggering."
        )

    _SOS_RATE_LIMIT[rate_key] = now_ts
    patient_id = patient["id"]
    pid_row = db.select_one("patient_identifiers", {"profile_id": patient_id})

    # Log critical SOS event into audit_logs
    sos_id = str(uuid.uuid4())
    event = {
        "id": sos_id,
        "user_id": patient_id,
        "action": "emergency_sos_triggered",
        "resource_type": "emergency_sos",
        "resource_id": sos_id,
        "ip_address": client_ip,
        "details": {
            "patient_name": patient.get("full_name"),
            "medikiosk_id": pid_row["medikiosk_id"] if pid_row else "PS000000",
            "phone": patient.get("phone"),
            "emergency_contact": patient.get("emergency_contact"),
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "note": payload.note or "Emergency SOS initiated from public portal",
            "status": "critical_active"
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("audit_logs", event)

    return {
        "status": "dispatched",
        "sos_id": sos_id,
        "message": "Emergency SOS alert logged and dispatched to triage queue.",
        "emergency_contacts": {
            "ambulance": "108",
            "national_emergency": "112",
            "registered_contact": patient.get("emergency_contact")
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/triage-alerts")
def get_triage_emergency_alerts(current_user: dict = Depends(get_current_user)):
    """
    Authoritative triage view of all active emergency SOS alerts and clinical red flags.
    Restricted to doctors, triage nurses, and hospital administrators.
    """
    role = current_user.get("role")
    if role not in ["doctor", "triage", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Triage emergency queue is restricted to clinical personnel."
        )

    # Fetch SOS triggers from audit_logs
    all_logs = db.select("audit_logs", {"action": "emergency_sos_triggered"})
    # Fetch clinical red flags from medical_summaries
    summaries = db.select("medical_summaries")
    red_flag_summaries = [s for s in summaries if s.get("red_flags") and len(s.get("red_flags")) > 0]

    alerts = []
    for log in all_logs:
        d = log.get("details", {})
        alerts.append({
            "type": "emergency_sos",
            "severity": "CRITICAL",
            "id": log.get("id"),
            "patient_name": d.get("patient_name", "Unknown"),
            "medikiosk_id": d.get("medikiosk_id", "N/A"),
            "phone": d.get("phone"),
            "emergency_contact": d.get("emergency_contact"),
            "location": {
                "latitude": d.get("latitude"),
                "longitude": d.get("longitude")
            } if d.get("latitude") and d.get("longitude") else None,
            "note": d.get("note"),
            "timestamp": log.get("created_at")
        })

    for s in red_flag_summaries:
        p_id = s.get("patient_id")
        prof = db.select_one("profiles", {"id": p_id}) or {}
        pid_row = db.select_one("patient_identifiers", {"profile_id": p_id}) or {}
        alerts.append({
            "type": "clinical_red_flag",
            "severity": "HIGH",
            "id": s.get("id"),
            "patient_name": prof.get("full_name", "Unknown Patient"),
            "medikiosk_id": pid_row.get("medikiosk_id", "N/A"),
            "phone": prof.get("phone"),
            "red_flags": s.get("red_flags", []),
            "chief_complaint": s.get("summary_json", {}).get("chief_complaint", "N/A"),
            "timestamp": s.get("created_at")
        })

    # Sort descending by timestamp
    alerts.sort(key=lambda x: str(x.get("timestamp", "")), reverse=True)
    return alerts
