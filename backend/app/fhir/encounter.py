"""
FHIR Encounter, Condition, Medication, Allergy, and DocumentReference Resources.
"""
from typing import Dict, Any


def to_fhir_encounter(encounter_data: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
    return {
        "resourceType": "Encounter",
        "id": encounter_data.get("id", "enc-001"),
        "status": "in-progress",
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "AMB",
            "display": "ambulatory"
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "reasonCode": [
            {
                "text": encounter_data.get("chief_complaint", "Clinical intake")
            }
        ]
    }


def to_fhir_condition(condition_name: str, patient_id: str, condition_id: str = "cond-001") -> Dict[str, Any]:
    return {
        "resourceType": "Condition",
        "id": condition_id,
        "clinicalStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
        },
        "code": {
            "text": condition_name
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        }
    }


def to_fhir_medication(med: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
    return {
        "resourceType": "MedicationStatement",
        "id": med.get("id", "med-001"),
        "status": "active",
        "medicationCodeableConcept": {
            "text": med.get("name", "Unknown Medication")
        },
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "dosage": [
            {
                "text": f"{med.get('dose', '')} {med.get('frequency', '')}".strip()
            }
        ]
    }


def to_fhir_allergy(allergy_name: str, patient_id: str) -> Dict[str, Any]:
    return {
        "resourceType": "AllergyIntolerance",
        "id": "alg-001",
        "clinicalStatus": {
            "coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]
        },
        "patient": {
            "reference": f"Patient/{patient_id}"
        },
        "code": {
            "text": allergy_name
        }
    }


def to_fhir_document_reference(doc: Dict[str, Any], patient_id: str) -> Dict[str, Any]:
    return {
        "resourceType": "DocumentReference",
        "id": doc.get("id", "doc-001"),
        "status": "current",
        "subject": {
            "reference": f"Patient/{patient_id}"
        },
        "type": {
            "text": doc.get("document_type", "Prescription")
        },
        "content": [
            {
                "attachment": {
                    "contentType": doc.get("mime_type", "application/pdf"),
                    "title": doc.get("file_name", "document.pdf")
                }
            }
        ]
    }
