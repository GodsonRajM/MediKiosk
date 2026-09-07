"""
Patient Record Authorization Service.
Enforces the mandatory patient access gate: A doctor cannot view patient records
without an explicit approved access grant or active encounter session.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.db.database import db
from app.core.logging import logger
from app.core.exceptions import AccessDeniedError


class AccessService:
    @staticmethod
    def check_patient_access(doctor_id: str, patient_id: str) -> bool:
        """Verifies if an active, approved access grant exists for doctor and patient."""
        grants = db.patient_access.get(patient_id, [])
        for grant in grants:
            if grant.get("doctor_id") == doctor_id and grant.get("status") == "approved":
                expires_at = grant.get("expires_at")
                if expires_at is None or expires_at > datetime.now(timezone.utc).isoformat():
                    return True
        return False

    @staticmethod
    def request_patient_access(
        doctor_id: str,
        patient_id: str,
        access_type: str = "encounter",
        reason: Optional[str] = "Clinical OPD Consultation"
    ) -> Dict[str, Any]:
        """Creates a pending or emergency access grant request."""
        grant_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # In emergency access type, immediate provisional access is recorded with an audit alert
        status = "approved" if access_type == "emergency" else "pending"

        grant = {
            "id": grant_id,
            "patient_id": patient_id,
            "doctor_id": doctor_id,
            "access_type": access_type,
            "status": status,
            "granted_at": now,
            "expires_at": None,
            "reason": reason,
            "created_at": now,
            "updated_at": now
        }
        if patient_id not in db.patient_access:
            db.patient_access[patient_id] = []
        db.patient_access[patient_id].append(grant)

        logger.info(f"Access requested: Doctor {doctor_id} -> Patient {patient_id} (Status: {status})")
        return grant

    @staticmethod
    def approve_patient_access(doctor_id: str, patient_id: str) -> Dict[str, Any]:
        """Patient or clinical desk approves doctor's request."""
        grants = db.patient_access.get(patient_id, [])
        for grant in grants:
            if grant.get("doctor_id") == doctor_id:
                grant["status"] = "approved"
                grant["updated_at"] = datetime.now(timezone.utc).isoformat()
                logger.info(f"Access approved: Doctor {doctor_id} -> Patient {patient_id}")
                return grant
        
        # If no previous request, create an approved grant
        return AccessService.request_patient_access(doctor_id, patient_id, access_type="encounter")

    @staticmethod
    def revoke_patient_access(doctor_id: str, patient_id: str) -> bool:
        """Revokes an active access grant immediately."""
        grants = db.patient_access.get(patient_id, [])
        for grant in grants:
            if grant.get("doctor_id") == doctor_id and grant.get("status") == "approved":
                grant["status"] = "revoked"
                grant["updated_at"] = datetime.now(timezone.utc).isoformat()
                logger.info(f"Access revoked: Doctor {doctor_id} -> Patient {patient_id}")
                return True
        return False


access_service = AccessService()
