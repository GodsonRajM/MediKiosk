from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from app.core.database import db
from app.core.security import get_current_user
from app.integrations.fhir_adapter import fhir_adapter

router = APIRouter(prefix="/doctors", tags=["Doctor Portal"])

@router.get("")
def list_available_doctors():
    """
    Returns list of genuine registered doctors so patients can select or verify on the home page.
    """
    doctors = db.select("profiles", {"role": "doctor"})
    result = []
    for d in doctors:
        doc_id_row = db.select_one("doctor_identifiers", {"profile_id": d["id"]})
        result.append({
            "id": d["id"],
            "name": d["full_name"],
            "doctor_id": doc_id_row["doctor_id"] if doc_id_row else "DK-000000",
            "specialization": doc_id_row.get("specialization", "General Medicine") if doc_id_row else "General Medicine"
        })
    return result

@router.get("/profile")
def get_doctor_profile(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("sub")
    profile = db.select_one("profiles", {"id": user_id})
    if not profile or profile.get("role") != "doctor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor access required")
    
    clean = dict(profile)
    clean.pop("hashed_password", None)
    
    did = db.select_one("doctor_identifiers", {"profile_id": user_id})
    clean["doctor_id"] = did["doctor_id"] if did else None
    clean["specialization"] = did.get("specialization", "General Medicine") if did else "General Medicine"
    return clean

@router.get("/patients")
def get_assigned_patients(current_user: dict = Depends(get_current_user)):
    """
    Returns list of patients connected to this doctor through doctor_patient_relationships.
    """
    doctor_id = current_user.get("sub")
    relationships = db.select("doctor_patient_relationships", {"doctor_id": doctor_id, "status": "active"})
    
    patient_list = []
    for rel in relationships:
        p_id = rel.get("patient_id")
        prof = db.select_one("profiles", {"id": p_id})
        if prof:
            pid_row = db.select_one("patient_identifiers", {"profile_id": p_id})
            # Check latest session summary
            summaries = db.select("medical_summaries", {"patient_id": p_id})
            latest_summary = summaries[-1] if summaries else None

            patient_list.append({
                "id": prof["id"],
                "full_name": prof["full_name"],
                "medikiosk_id": pid_row["medikiosk_id"] if pid_row else "N/A",
                "age": prof.get("age"),
                "phone": prof.get("phone"),
                "connected_since": rel.get("created_at"),
                "has_summary": latest_summary is not None,
                "red_flags": latest_summary.get("red_flags", []) if latest_summary else []
            })
    return patient_list

@router.get("/patients/search")
def search_patients(
    query: str = Query(..., min_length=1),
    current_user: dict = Depends(get_current_user)
):
    """
    Live query against Supabase database for patients by Name or MK-XXXXXX ID.
    Zero fake search records.
    """
    doctor_id = current_user.get("sub")
    q = query.strip().lower()

    all_patients = db.select("profiles", {"role": "patient"})
    matches = []

    for p in all_patients:
        pid_row = db.select_one("patient_identifiers", {"profile_id": p["id"]})
        mk_id = pid_row["medikiosk_id"].lower() if pid_row else ""
        name = p["full_name"].lower()

        if q in mk_id or q in name:
            # Check if this doctor is authorized for this patient
            is_authorized = db.select_one("doctor_patient_relationships", {
                "doctor_id": doctor_id,
                "patient_id": p["id"],
                "status": "active"
            }) is not None

            matches.append({
                "id": p["id"],
                "full_name": p["full_name"],
                "medikiosk_id": pid_row["medikiosk_id"] if pid_row else "N/A",
                "age": p.get("age"),
                "phone": p.get("phone"),
                "is_authorized": is_authorized
            })
    return matches

@router.get("/patients/{patient_id}/case")
def get_patient_clinical_case(patient_id: str, current_user: dict = Depends(get_current_user)):
    """
    Authoritative Clinical Case Viewer for Doctor.
    Verifies relationship authorization before exposing sensitive health records.
    """
    doctor_id = current_user.get("sub")
    
    # 1. Authorization check
    rel = db.select_one("doctor_patient_relationships", {
        "doctor_id": doctor_id,
        "patient_id": patient_id,
        "status": "active"
    })
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not authorized to view this patient's medical records without an active clinical connection."
        )

    patient_prof = db.select_one("profiles", {"id": patient_id})
    if not patient_prof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")

    clean_p = dict(patient_prof)
    clean_p.pop("hashed_password", None)
    pid_row = db.select_one("patient_identifiers", {"profile_id": patient_id})
    clean_p["medikiosk_id"] = pid_row["medikiosk_id"] if pid_row else "N/A"

    history = db.select("medical_history", {"patient_id": patient_id})
    timeline = db.select("medical_timeline", {"patient_id": patient_id})
    timeline.sort(key=lambda x: str(x.get("event_date", "")), reverse=True)
    documents = db.select("medical_documents", {"patient_id": patient_id})
    summaries = db.select("medical_summaries", {"patient_id": patient_id})
    latest_summary = summaries[-1] if summaries else None

    # Red-flags from latest summary
    red_flags = latest_summary.get("red_flags", []) if latest_summary else []

    # FHIR export ready bundle
    fhir_bundle = None
    if latest_summary:
        fhir_bundle = fhir_adapter.create_bundle(
            patient_profile=clean_p,
            medikiosk_id=clean_p["medikiosk_id"],
            summary=latest_summary.get("summary_json", {}),
            red_flags=red_flags
        )

    return {
        "patient": clean_p,
        "summary": latest_summary,
        "red_flags": red_flags,
        "history": history,
        "timeline": timeline,
        "documents": documents,
        "fhir_bundle": fhir_bundle
    }

@router.post("/patients/{patient_id}/verify-summary")
def verify_patient_summary(
    patient_id: str,
    payload: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    doctor_id = current_user.get("sub")
    summary_id = payload.get("summary_id")
    notes = payload.get("notes", "Reviewed and verified by attending physician.")
    
    review_record = {
        "id": str(uuid.uuid4()),
        "summary_id": summary_id,
        "doctor_id": doctor_id,
        "notes": notes,
        "status": "reviewed",
        "reviewed_at": datetime.now(timezone.utc).isoformat()
    }
    db.insert("doctor_reviews", review_record)
    return {"status": "success", "message": "Clinical case review recorded."}
