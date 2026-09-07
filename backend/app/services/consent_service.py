"""
Consent Management Service.
Enforces patient consent recording and status checks before voice, document, or AI processing.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.db.database import db
from app.schemas.consent import ConsentRecordCreate, ConsentResponse
from app.core.exceptions import ConsentRequiredError


class ConsentService:
    @staticmethod
    def record_consents(data: ConsentRecordCreate) -> List[ConsentResponse]:
        patient_id = data.patient_id
        now = datetime.now(timezone.utc).isoformat()
        
        if patient_id not in db.consents:
            db.consents[patient_id] = []

        recorded = []
        for item in data.consents:
            consent_record = {
                "id": str(uuid.uuid4()),
                "patient_id": patient_id,
                "session_id": data.session_id,
                "consent_type": item.consent_type,
                "status": item.status,
                "language": item.language,
                "consent_version": data.consent_version,
                "consented_at": now
            }
            db.consents[patient_id].append(consent_record)
            recorded.append(ConsentResponse(**consent_record))
        return recorded

    @staticmethod
    def get_patient_consents(patient_id: str) -> List[Dict[str, Any]]:
        return db.consents.get(patient_id, [])

    @staticmethod
    def verify_consent(patient_id: str, consent_type: str) -> bool:
        """Throws ConsentRequiredError if consent has not been granted."""
        consents = db.consents.get(patient_id, [])
        for c in consents:
            if c.get("consent_type") == consent_type and c.get("status") == "granted":
                return True
        raise ConsentRequiredError(consent_type)


consent_service = ConsentService()
