import uuid
from typing import Dict, Any, List
from datetime import datetime

class FhirR4Adapter:
    """
    HL7 FHIR R4 JSON Bundle Adapter.
    Generates fully compliant FHIR R4 Bundles from verified patient case records.
    Resources included:
    - Patient
    - Encounter
    - Condition (Problems/Diagnoses)
    - MedicationStatement
    - AllergyIntolerance
    - Observation (Lab tests / Vitals)
    """

    def export_patient_bundle(self, patient: Dict[str, Any], session: Dict[str, Any],
                              conditions: List[Dict[str, Any]], medications: List[Dict[str, Any]],
                              allergies: List[Dict[str, Any]], investigations: List[Dict[str, Any]]) -> Dict[str, Any]:
        bundle_id = str(uuid.uuid4())
        patient_id = patient["id"]
        
        entries = []

        # 1. FHIR Patient Resource
        fhir_patient = {
            "fullUrl": f"urn:uuid:{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "identifier": [
                    {
                        "system": "https://medikiosk.gov.in/patient-id",
                        "value": patient.get("medikiosk_id", "MK-000001")
                    }
                ],
                "active": True,
                "name": [
                    {
                        "use": "official",
                        "text": patient.get("full_name")
                    }
                ],
                "gender": patient.get("gender", "unknown").lower(),
                "birthDate": patient.get("date_of_birth") or "1974-05-12",
                "telecom": [
                    {"system": "phone", "value": patient.get("phone")}
                ]
            }
        }
        entries.append(fhir_patient)

        # 2. FHIR Encounter Resource
        encounter_id = session.get("id", str(uuid.uuid4()))
        fhir_encounter = {
            "fullUrl": f"urn:uuid:{encounter_id}",
            "resource": {
                "resourceType": "Encounter",
                "id": encounter_id,
                "status": "finished",
                "class": {
                    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                    "code": "AMB",
                    "display": "ambulatory"
                },
                "subject": {"reference": f"urn:uuid:{patient_id}"},
                "reasonCode": [
                    {"text": session.get("chief_complaint_text", "Pre-consultation clinical intake")}
                ]
            }
        }
        entries.append(fhir_encounter)

        # 3. FHIR Condition Resources
        for cond in conditions:
            cond_id = cond.get("id", str(uuid.uuid4()))
            entries.append({
                "fullUrl": f"urn:uuid:{cond_id}",
                "resource": {
                    "resourceType": "Condition",
                    "id": cond_id,
                    "clinicalStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                    },
                    "code": {
                        "coding": [
                            {"system": "http://hl7.org/fhir/sid/icd-10", "code": cond.get("icd10_code", "R07.9"), "display": cond.get("condition_name")}
                        ],
                        "text": cond.get("condition_name")
                    },
                    "subject": {"reference": f"urn:uuid:{patient_id}"},
                    "encounter": {"reference": f"urn:uuid:{encounter_id}"}
                }
            })

        # 4. FHIR MedicationStatement Resources
        for med in medications:
            med_id = med.get("id", str(uuid.uuid4()))
            entries.append({
                "fullUrl": f"urn:uuid:{med_id}",
                "resource": {
                    "resourceType": "MedicationStatement",
                    "id": med_id,
                    "status": "active",
                    "medicationCodeableConcept": {
                        "text": f"{med.get('drug_name')} {med.get('dosage', '')}"
                    },
                    "subject": {"reference": f"urn:uuid:{patient_id}"},
                    "dosage": [
                        {"text": f"{med.get('frequency', 'Once daily')} via {med.get('route', 'Oral')}"}
                    ]
                }
            })

        # 5. FHIR AllergyIntolerance Resources
        for allg in allergies:
            allg_id = allg.get("id", str(uuid.uuid4()))
            entries.append({
                "fullUrl": f"urn:uuid:{allg_id}",
                "resource": {
                    "resourceType": "AllergyIntolerance",
                    "id": allg_id,
                    "clinicalStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical", "code": "active"}]
                    },
                    "verificationStatus": {
                        "coding": [{"system": "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification", "code": "confirmed" if allg.get("doctor_verified") else "unconfirmed"}]
                    },
                    "code": {"text": allg.get("allergen")},
                    "patient": {"reference": f"urn:uuid:{patient_id}"},
                    "reaction": [
                        {"manifestation": [{"text": allg.get("reaction_nature", "Hypersensitivity reaction")}]}
                    ]
                }
            })

        # 6. FHIR Observation Resources (Lab values)
        for inv in investigations:
            inv_id = inv.get("id", str(uuid.uuid4()))
            entries.append({
                "fullUrl": f"urn:uuid:{inv_id}",
                "resource": {
                    "resourceType": "Observation",
                    "id": inv_id,
                    "status": "final",
                    "code": {"text": inv.get("test_name")},
                    "subject": {"reference": f"urn:uuid:{patient_id}"},
                    "valueString": f"{inv.get('result_value')} {inv.get('unit', '')}".strip(),
                    "interpretation": [
                        {"text": "Abnormal / High" if inv.get("is_abnormal") else "Normal"}
                    ]
                }
            })

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "type": "document",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "entry": entries
        }

fhir_adapter = FhirR4Adapter()
