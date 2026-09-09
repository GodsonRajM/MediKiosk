import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.schemas.doctor import DoctorQueueItem, FieldVerificationRequest, SignOffRequest, DoctorReviewResponse
from app.core.database import db
from app.core.security import get_current_user
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/doctors", tags=["Doctor Portal & Clinical Verification"])

@router.get("")
async def list_doctors():
    """Returns list of registered doctors for patient kiosk intake assignment."""
    docs = []
    for d in db.doctors.values():
        docs.append({
            "id": d["id"],
            "doctor_id": d["doctor_id"],
            "full_name": d["full_name"],
            "specialization": d.get("specialization", "General Physician"),
            "email": d.get("email"),
            "phone": d.get("phone")
        })
    return docs

@router.get("/search")
async def search_doctors(q: str = Query(..., description="Search doctor by name or ID")):
    query = q.strip().lower()
    results = []
    for d in db.doctors.values():
        if (
            query in d.get("doctor_id", "").lower() or
            query in d.get("full_name", "").lower() or
            query in d.get("specialization", "").lower()
        ):
            results.append({
                "id": d["id"],
                "doctor_id": d["doctor_id"],
                "full_name": d["full_name"],
                "specialization": d.get("specialization", "General Physician")
            })
    return results

@router.post("/connect")
async def connect_doctor_patient(payload: Dict[str, Any], current_user: Dict[str, Any] = Depends(get_current_user)):
    patient_id = payload.get("patient_id")
    doctor_id = payload.get("doctor_id")

    if not patient_id or not doctor_id:
        raise HTTPException(status_code=400, detail="Both patient_id and doctor_id are required.")

    # Match doctor by ID or MK-D...
    real_doc_id = doctor_id
    if doctor_id not in db.doctors:
        for d in db.doctors.values():
            if d.get("doctor_id") == doctor_id or d.get("id") == doctor_id:
                real_doc_id = d["id"]
                break

    rel_id = str(uuid.uuid4())
    rel = {
        "id": rel_id,
        "patient_id": patient_id,
        "doctor_id": real_doc_id,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat()
    }
    db.doctor_patient_relationships.append(rel)

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("doctor_patient_relationships").insert(rel).execute()
        except Exception:
            pass

    return {"status": "SUCCESS", "relationship": rel}

@router.get("/queue", response_model=List[DoctorQueueItem])
async def get_doctor_queue(current_user: Dict[str, Any] = Depends(get_current_user)):
    queue = []
    
    # Check sessions
    for s_id, session in db.clinical_sessions.items():
        p_id = session["patient_id"]
        patient = db.patients.get(p_id)
        if not patient:
            # Match by medikiosk_id if needed
            for p in db.patients.values():
                if p["id"] == p_id or p.get("medikiosk_id") == p_id:
                    patient = p
                    break
        if not patient:
            continue

        has_flags = any(f.get("session_id") == s_id and f.get("is_active") for f in db.red_flags)
        flag_count = len([f for f in db.red_flags if f.get("session_id") == s_id and f.get("is_active")])

        priority = "NORMAL"
        if has_flags:
            priority = "CRITICAL" if any(f.get("severity") == "CRITICAL" for f in db.red_flags if f.get("session_id") == s_id) else "HIGH"

        queue.append(DoctorQueueItem(
            patient_id=p_id,
            medikiosk_id=patient.get("medikiosk_id", "MK-P00000"),
            patient_name=patient.get("full_name", "Patient"),
            age=patient.get("age", 40),
            gender=patient.get("gender", "Other"),
            chief_complaint=session.get("chief_complaint_text") or "Intake completed",
            priority=priority,
            has_red_flags=has_flags,
            red_flag_count=flag_count,
            wait_time_minutes=5,
            completion_percentage=100 if session.get("session_status") == "READY_FOR_REVIEW" else 75,
            session_id=s_id,
            session_status=session.get("session_status", "IN_PROGRESS")
        ))

    # Also list registered patients who connected to this doctor even if session hasn't started
    for rel in db.doctor_patient_relationships:
        p_id = rel["patient_id"]
        if not any(q.patient_id == p_id for q in queue):
            patient = db.patients.get(p_id)
            if patient:
                queue.append(DoctorQueueItem(
                    patient_id=p_id,
                    medikiosk_id=patient.get("medikiosk_id", "MK-P00000"),
                    patient_name=patient.get("full_name", "Patient"),
                    age=patient.get("age", 40),
                    gender=patient.get("gender", "Other"),
                    chief_complaint="Connected for Consultation",
                    priority="NORMAL",
                    has_red_flags=False,
                    red_flag_count=0,
                    wait_time_minutes=2,
                    completion_percentage=25,
                    session_id=p_id,
                    session_status="WAITING"
                ))

    # Sort queue: CRITICAL first, then HIGH, then NORMAL
    priority_weights = {"CRITICAL": 0, "HIGH": 1, "NORMAL": 2}
    return sorted(queue, key=lambda x: priority_weights.get(x.priority, 3))

@router.get("/patient/{patient_id}/full-record")
async def get_full_patient_record(patient_id: str, current_user: Dict[str, Any] = Depends(get_current_user)):
    patient = db.patients.get(patient_id)
    if not patient:
        for p in db.patients.values():
            if p.get("medikiosk_id") == patient_id:
                patient = p
                patient_id = p["id"]
                break
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")

    session = next((s for s in db.clinical_sessions.values() if s["patient_id"] == patient_id), None)
    session_id = session["id"] if session else None

    conditions = [c for c in db.medical_conditions if c["patient_id"] == patient_id]
    medications = [m for m in db.medications if m["patient_id"] == patient_id]
    allergies = [a for a in db.allergies if a["patient_id"] == patient_id]
    investigations = [i for i in db.investigations if i["patient_id"] == patient_id]
    timeline = sorted([t for t in db.medical_timeline if t["patient_id"] == patient_id], key=lambda x: x.get("event_date", ""), reverse=True)
    red_flags = [f for f in db.red_flags if f.get("patient_id") == patient_id and f.get("is_active")]
    documents = [d for d in db.documents if d.get("patient_id") == patient_id]
    history_records = [h for h in db.medical_history if h.get("patient_id") == patient_id]
    ayush = db.ayush_assessments.get(session_id) if session_id else None
    summary = db.summaries.get(session_id) if session_id else None

    return {
        "patient": patient,
        "session": session,
        "conditions": conditions,
        "medications": medications,
        "allergies": allergies,
        "investigations": investigations,
        "timeline": timeline,
        "red_flags": red_flags,
        "documents": documents,
        "medical_history": history_records,
        "ayush": ayush,
        "summary": summary
    }

@router.post("/review/{session_id}/verify-field")
async def verify_field(session_id: str, req: FieldVerificationRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if req.field_type == "medication":
        for m in db.medications:
            if m["id"] == req.field_id:
                m["doctor_verified"] = (req.action == "CONFIRMED")
                break
    elif req.field_type == "allergy":
        for a in db.allergies:
            if a["id"] == req.field_id:
                a["doctor_verified"] = (req.action == "CONFIRMED")
                if req.action == "CONFIRMED":
                    a["contradiction_flag"] = False
                break
    elif req.field_type == "investigation":
        for inv in db.investigations:
            if inv["id"] == req.field_id:
                inv["doctor_verified"] = (req.action == "CONFIRMED")
                break

    return {"status": "SUCCESS", "field_id": req.field_id, "action": req.action}

@router.post("/review/{session_id}/sign-off")
async def sign_off_case(session_id: str, req: SignOffRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    session = db.clinical_sessions.get(session_id)
    patient_id = session["patient_id"] if session else session_id

    if session:
        session["session_status"] = "COMPLETED"
        session["completed_at"] = datetime.utcnow().isoformat()

    review_id = str(uuid.uuid4())
    db.doctor_reviews[session_id] = {
        "id": review_id,
        "session_id": session_id,
        "patient_id": patient_id,
        "doctor_id": current_user.get("id"),
        "clinical_notes": req.clinical_notes,
        "provisional_plan": req.provisional_plan,
        "verified_at": datetime.utcnow().isoformat(),
        "is_signed_off": True
    }

    db.audit_logs.append({
        "id": str(uuid.uuid4()),
        "user_id": current_user.get("id", "DOCTOR"),
        "patient_id": patient_id,
        "session_id": session_id,
        "action_type": "DOCTOR_VERIFICATION_SIGNOFF",
        "resource_accessed": "CLINICAL_SUMMARY_RECORD",
        "created_at": datetime.utcnow().isoformat()
    })

    return {"status": "SUCCESS", "message": "Clinical case verified and signed off successfully", "review_id": review_id}
