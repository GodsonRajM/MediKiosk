"""
FHIR Patient Resource Transformer.
Compliant with HL7 FHIR Release 4 and ABDM (Ayushman Bharat Digital Mission) profile.
"""
from typing import Dict, Any


def to_fhir_patient(patient: Dict[str, Any]) -> Dict[str, Any]:
    identifiers = [
        {
            "system": "https://medikiosk.gov.in/patient-code",
            "value": patient.get("patient_code")
        }
    ]
    if patient.get("abha_id"):
        identifiers.append({
            "system": "https://abdm.gov.in/abha",
            "value": patient.get("abha_id")
        })

    telecom = []
    if patient.get("phone"):
        telecom.append({
            "system": "phone",
            "value": patient.get("phone"),
            "use": "mobile"
        })

    resource = {
        "resourceType": "Patient",
        "id": patient.get("id"),
        "identifier": identifiers,
        "active": True,
        "name": [
            {
                "use": "official",
                "text": patient.get("name")
            }
        ],
        "gender": patient.get("gender", "unknown"),
        "telecom": telecom,
        "communication": [
            {
                "language": {
                    "coding": [
                        {
                            "system": "urn:ietf:bcp:47",
                            "code": patient.get("preferred_language", "en")
                        }
                    ]
                },
                "preferred": True
            }
        ]
    }
    if patient.get("date_of_birth"):
        resource["birthDate"] = str(patient.get("date_of_birth"))
    return resource
