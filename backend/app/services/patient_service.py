"""
Patient Management Service.
Handles patient identification, demographic registration, and clinical record retrieval.
"""
import uuid
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.db.database import db
from app.schemas.patient import PatientCreate, PatientSummaryCard
from app.core.exceptions import PatientNotFoundError


class PatientService:
    @staticmethod
    def get_all_patients() -> List[PatientSummaryCard]:
        cards = []
        for p_id, p in db.patients.items():
            flags = db.red_flags.get(p_id, [])
            high_sev = any(f.get("severity") == "high" for f in flags)
            
            # Find latest chief complaint from interviews
            cc = None
            for _, inv in db.interviews.items():
                if inv.get("patient_id") == p_id:
                    cc = inv.get("chief_complaint")
            
            cards.append(PatientSummaryCard(
                id=p_id,
                patient_code=p.get("patient_code", "P000"),
                name=p.get("name", "Unknown"),
                age=p.get("age"),
                gender=p.get("gender"),
                chief_complaint=cc,
                red_flag_count=len(flags),
                high_severity_flag=high_sev,
                status="waiting"
            ))
        return cards

    @staticmethod
    def get_patient_by_id(patient_id: str) -> Dict[str, Any]:
        patient = db.patients.get(patient_id)
        if not patient:
            # Check by patient_code
            for _, p in db.patients.items():
                if p.get("patient_code", "").upper() == patient_id.upper():
                    return p
            raise PatientNotFoundError(f"Patient with identifier '{patient_id}' not found.")
        return patient

    @staticmethod
    def create_patient(data: PatientCreate) -> Dict[str, Any]:
        p_id = str(uuid.uuid4())
        code = data.patient_code or f"P{random.randint(100, 999)}"
        now = datetime.now(timezone.utc).isoformat()
        
        patient_record = {
            "id": p_id,
            "patient_code": code,
            "name": data.name,
            "date_of_birth": str(data.date_of_birth) if data.date_of_birth else None,
            "age": data.age,
            "gender": data.gender,
            "phone": data.phone,
            "abha_id": data.abha_id,
            "preferred_language": data.preferred_language or "en",
            "created_at": now,
            "updated_at": now
        }
        db.patients[p_id] = patient_record
        return patient_record


patient_service = PatientService()
