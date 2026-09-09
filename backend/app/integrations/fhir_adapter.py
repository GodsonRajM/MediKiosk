import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List

class FHIRAdapter:
    """
    HL7 FHIR R4 Compliant Bundle Exporter for MediKiosk.
    Transforms real pre-consultation case-taking records into standard FHIR bundles.
    """
    def create_bundle(
        self,
        patient_profile: Dict[str, Any],
        medikiosk_id: str,
        summary: Dict[str, Any],
        red_flags: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        bundle_id = str(uuid.uuid4())
        patient_fhir_id = str(uuid.uuid4())
        encounter_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()

        entries = []

        # 1. Patient Resource
        entries.append({
            "fullUrl": f"urn:uuid:{patient_fhir_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_fhir_id,
                "identifier": [
                    {
                        "system": "https://medikiosk.in/identifiers/patient",
                        "value": medikiosk_id
                    }
                ],
                "name": [
                    {
                        "use": "official",
                        "text": patient_profile.get("full_name", "Patient")
                    }
                ],
                "telecom": [
                    {
                        "system": "phone",
                        "value": patient_profile.get("phone", "")
                    }
                ]
            }
        })

        # 2. Encounter Resource
        entries.append({
            "fullUrl": f"urn:uuid:{encounter_id}",
            "resource": {
                "resourceType": "Encounter",
                "id": encounter_id,
                "status": "in-progress",
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory"
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_fhir_id}"
                },
                "period": {
                    "start": now_iso
                }
            }
        })

        # 3. Chief Complaint Observation
        cc = summary.get("chief_complaint", "")
        if cc:
            entries.append({
                "resource": {
                    "resourceType": "Observation",
                    "status": "preliminary",
                    "code": {
                        "text": "Chief Complaint / Presenting Symptom"
                    },
                    "subject": {"reference": f"urn:uuid:{patient_fhir_id}"},
                    "valueString": cc
                }
            })

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "document",
            "timestamp": now_iso,
            "entry": entries
        }

fhir_adapter = FHIRAdapter()
