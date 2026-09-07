"""
FHIR Bundle Adapter Service.
Assembles internal patient clinical data, timeline events, medications, and labs
into an HL7 FHIR R4 Bundle ready for ABDM (Ayushman Bharat Digital Mission) exchange.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.db.database import db
from app.fhir.patient import to_fhir_patient
from app.fhir.observation import to_fhir_observation
from app.fhir.encounter import (
    to_fhir_encounter,
    to_fhir_condition,
    to_fhir_medication,
    to_fhir_document_reference
)


class FHIRAdapter:
    @staticmethod
    def generate_patient_bundle(patient_id: str) -> Dict[str, Any]:
        patient = db.patients.get(patient_id)
        if not patient:
            raise ValueError(f"Patient with ID '{patient_id}' not found.")

        entries: List[Dict[str, Any]] = []

        # 1. Patient Resource
        fhir_patient = to_fhir_patient(patient)
        entries.append({"fullUrl": f"urn:uuid:{patient_id}", "resource": fhir_patient})

        # 2. Encounter Resource (if an interview exists)
        for _, interview in db.interviews.items():
            if interview.get("patient_id") == patient_id:
                enc = to_fhir_encounter(interview, patient_id)
                entries.append({"fullUrl": f"urn:uuid:{enc['id']}", "resource": enc})
                break

        # 3. Medications
        medications = db.medications.get(patient_id, [])
        for med in medications:
            med_res = to_fhir_medication(med, patient_id)
            entries.append({"fullUrl": f"urn:uuid:{med_res['id']}", "resource": med_res})

        # 4. Investigations / Observations
        investigations = db.investigations.get(patient_id, [])
        for inv in investigations:
            obs = to_fhir_observation(inv, patient_id)
            entries.append({"fullUrl": f"urn:uuid:{obs['id']}", "resource": obs})

        # 5. Documents
        for _, doc in db.documents.items():
            if doc.get("patient_id") == patient_id:
                doc_ref = to_fhir_document_reference(doc, patient_id)
                entries.append({"fullUrl": f"urn:uuid:{doc_ref['id']}", "resource": doc_ref})

        # Assemble Bundle
        bundle = {
            "resourceType": "Bundle",
            "id": f"bundle-{patient_id[:8]}",
            "type": "document",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "entry": entries
        }
        return bundle


fhir_adapter = FHIRAdapter()
