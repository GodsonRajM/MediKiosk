import pytest
from app.integrations.fhir_adapter import fhir_adapter

def test_fhir_bundle_export():
    patient = {
        "id": "11111111-1111-1111-1111-111111111111",
        "medikiosk_id": "MK-000001",
        "full_name": "Sundaram Ramaswamy",
        "gender": "Male",
        "phone": "+919876543210"
    }
    session = {"id": "22222222-2222-2222-2222-222222222222", "chief_complaint_text": "Chest pain"}
    conditions = [{"id": "c1", "condition_name": "Type 2 Diabetes Mellitus", "icd10_code": "E11.9"}]
    medications = [{"id": "m1", "drug_name": "Metformin", "dosage": "500 mg", "frequency": "Twice daily"}]
    allergies = [{"id": "a1", "allergen": "Penicillin", "doctor_verified": True}]
    investigations = [{"id": "i1", "test_name": "HbA1c", "result_value": "8.2", "unit": "%", "is_abnormal": True}]

    bundle = fhir_adapter.export_patient_bundle(
        patient=patient,
        session=session,
        conditions=conditions,
        medications=medications,
        allergies=allergies,
        investigations=investigations
    )

    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) >= 5
    resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
    assert "Patient" in resource_types
    assert "Encounter" in resource_types
    assert "Condition" in resource_types
    assert "MedicationStatement" in resource_types
    assert "AllergyIntolerance" in resource_types
    assert "Observation" in resource_types
