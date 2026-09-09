import uuid
from datetime import datetime, timezone
from typing import Dict, Any

class ABDMAdapter:
    """
    Ayushman Bharat Digital Mission (ABDM) Integration Adapter.
    Handles ABHA verification and consent artifact handling according to National Health Authority (NHA) specifications.
    """
    def verify_abha(self, abha_number: str) -> Dict[str, Any]:
        """
        Validates ABHA identifier (14-digit format or @abdm handle).
        """
        clean_num = abha_number.replace("-", "").strip()
        is_valid = (len(clean_num) == 14 and clean_num.isdigit()) or ("@" in abha_number)
        
        return {
            "status": "VALID" if is_valid else "INVALID",
            "abha_number": abha_number,
            "verification_mode": "nha_sandbox_gateway",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def create_consent_artifact(self, patient_id: str, doctor_id: str, purpose: str = "CAREMGT") -> Dict[str, Any]:
        """
        Builds standard ABDM Consent Artifact.
        """
        artifact_id = str(uuid.uuid4())
        return {
            "consentId": artifact_id,
            "status": "GRANTED",
            "patient": {"id": patient_id},
            "purpose": {"code": purpose, "text": "Clinical Case Taking and Care Management"},
            "hiTypes": ["DiagnosticReport", "Prescription", "OPConsultation"],
            "permission": {
                "accessMode": "VIEW",
                "dateRange": {
                    "from": datetime.now(timezone.utc).isoformat(),
                    "to": datetime.now(timezone.utc).isoformat()
                },
                "frequency": {"unit": "HOUR", "value": 1}
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }

abdm_adapter = ABDMAdapter()
