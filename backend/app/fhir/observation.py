"""
FHIR Observation Resource Transformer (Vitals, Lab Results, and Symptoms).
"""
from typing import Dict, Any


def to_fhir_observation(obs_data: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
    return {
        "resourceType": "Observation",
        "id": obs_data.get("id", "obs-001"),
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "laboratory" if "result" in obs_data else "exam"
                    }
                ]
            }
        ],
        "code": {
            "text": obs_data.get("test_name") or obs_data.get("title", "Observation")
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "valueString": str(obs_data.get("result") or obs_data.get("description", ""))
    }
