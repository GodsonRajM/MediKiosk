import uuid
from typing import Dict, Any
from datetime import datetime, timedelta

class AbdmAdapter:
    """
    ABDM (Ayushman Bharat Digital Mission) Mock-First Adapter.
    Implements M1 (ABHA verification), M2 (Consent manager artifacts), and M3 (Data exchange).
    Always operates in mock mode (ABDM_MODE=mock) unless sandbox credentials are provided.
    """

    def verify_abha(self, abha_id: str) -> Dict[str, Any]:
        """Simulates ABDM M1 ABHA Verification."""
        return {
            "status": "SUCCESS",
            "abha_number": "91-4521-8890-1234",
            "abha_address": "sundaram.ramaswamy@abdm",
            "full_name": "Sundaram Ramaswamy",
            "gender": "M",
            "year_of_birth": 1974,
            "verification_source": "ABDM_GATEWAY_MOCK",
            "timestamp": datetime.utcnow().isoformat()
        }

    def create_consent_artifact(self, patient_id: str, doctor_id: str, hi_types: list) -> Dict[str, Any]:
        """Simulates ABDM M2 Consent Artifact Generation."""
        consent_id = str(uuid.uuid4())
        expiry = datetime.utcnow() + timedelta(hours=24)
        return {
            "consent_request_id": consent_id,
            "status": "GRANTED",
            "patient_reference": patient_id,
            "hi_types": hi_types or ["Prescription", "DiagnosticReport", "OPConsultation"],
            "purpose": {
                "code": "CAREATND",
                "text": "Care Management / OPD Consultation"
            },
            "valid_from": datetime.utcnow().isoformat(),
            "valid_to": expiry.isoformat(),
            "consent_manager": "sbx.abdm.gov.in"
        }

    def fetch_health_records(self, consent_artifact_id: str) -> Dict[str, Any]:
        """Simulates ABDM M3 Health Data Fetch via HIP."""
        return {
            "status": "COMPLETED",
            "consent_artifact_id": consent_artifact_id,
            "records_found": 2,
            "records": [
                {
                    "care_context_reference": "GMC-OPD-2020",
                    "hi_type": "OPConsultation",
                    "date": "2020-11-05",
                    "summary": "Essential Hypertension diagnosed; Amlodipine 5mg started."
                },
                {
                    "care_context_reference": "GMC-LAB-2026",
                    "hi_type": "DiagnosticReport",
                    "date": "2026-06-15",
                    "summary": "HbA1c test result: 8.2% (Suboptimal control)."
                }
            ]
        }

abdm_adapter = AbdmAdapter()
