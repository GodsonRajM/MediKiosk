import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_clean_db():
    db.reset_to_clean_state()

def test_patient_registration_with_mandatory_consent():
    # 1. Missing consent should be rejected
    bad_res = client.post("/api/v1/auth/register/patient", json={
        "full_name": "Kavitha Raman",
        "phone": "+919876500001",
        "password": "Password123!",
        "gender": "Female",
        "consent_granted": False
    })
    assert bad_res.status_code == 400
    assert "consent" in bad_res.json()["detail"].lower()

    # 2. Valid registration with explicit consent
    res = client.post("/api/v1/auth/register/patient", json={
        "full_name": "Kavitha Raman",
        "phone": "+919876500001",
        "email": "kavitha.r@example.com",
        "password": "Password123!",
        "age": 34,
        "gender": "Female",
        "address": "42 Cross St, Bangalore",
        "blood_group": "B+",
        "preferred_language": "kn",
        "consent_granted": True
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["medikiosk_id"].startswith("MK-P")
    assert data["user"]["preferred_language"] == "kn"
    medikiosk_id = data["user"]["medikiosk_id"]

    # 3. Test Login with newly generated Patient ID
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": medikiosk_id,
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["user"]["full_name"] == "Kavitha Raman"

def test_doctor_registration_and_search():
    # Register Doctor
    doc_res = client.post("/api/v1/auth/register/doctor", json={
        "full_name": "Dr. Ananya Rao",
        "email": "dr.ananya@hospital.org",
        "phone": "+919876599999",
        "password": "DoctorPassword123!",
        "specialization": "Cardiologist",
        "license_number": "KMC-98765",
        "consent_granted": True
    })
    assert doc_res.status_code == 200
    doc_data = doc_res.json()
    assert doc_data["user"]["doctor_id"].startswith("MK-D")
    doc_id = doc_data["user"]["doctor_id"]

    # Search Doctor
    search_res = client.get(f"/api/v1/doctors/search?q=Ananya")
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) >= 1
    assert results[0]["doctor_id"] == doc_id

def test_patient_session_and_interview_flow():
    # Register patient
    reg = client.post("/api/v1/auth/register/patient", json={
        "full_name": "Ramesh Kumar",
        "phone": "+919876500002",
        "password": "Password123!",
        "gender": "Male",
        "consent_granted": True,
        "preferred_language": "kn"
    })
    patient_id = reg.json()["user"]["patient_id"]

    # Start session
    sess_res = client.post("/api/v1/sessions/start", json={
        "patient_id": patient_id,
        "preferred_language": "kn",
        "mode": "AYUSH"
    })
    assert sess_res.status_code == 200
    session_id = sess_res.json()["id"]

    # Get first question
    q_res = client.get(f"/api/v1/interviews/{session_id}/next-question")
    assert q_res.status_code == 200
    q_data = q_res.json()
    assert not q_data["is_complete"]
    assert "question" in q_data
    # Verify Kannada translation returned
    assert q_data["question"]["question_id"] == "CHIEF_COMPLAINT"
    assert "ಆಸ್ಪತ್ರೆಗೆ" in q_data["question"]["question_text"]

    # Submit answer
    ans_res = client.post(f"/api/v1/interviews/{session_id}/answers", json={
        "question_id": "CHIEF_COMPLAINT",
        "answer_text": "Severe chest pain and tightness",
        "input_method": "touch"
    })
    assert ans_res.status_code == 200

def test_medical_history_crud():
    # Register patient
    reg = client.post("/api/v1/auth/register/patient", json={
        "full_name": "Sunita Devi",
        "phone": "+919876500003",
        "password": "Password123!",
        "gender": "Female",
        "consent_granted": True
    })
    patient_id = reg.json()["user"]["patient_id"]

    # Initially empty history
    h_res = client.get(f"/api/v1/patients/{patient_id}/history")
    assert h_res.status_code == 200
    assert len(h_res.json()) == 0

    # Add medical record
    create_res = client.post(f"/api/v1/patients/{patient_id}/history", json={
        "record_type": "PRESCRIPTION",
        "title": "Dr. Sharma Prescription",
        "description": "Daily multivitamins",
        "file_name": "prescription_may2026.pdf"
    })
    assert create_res.status_code == 200
    record_id = create_res.json()["record"]["id"]

    # Check history contains record
    h_res2 = client.get(f"/api/v1/patients/{patient_id}/history")
    assert len(h_res2.json()) == 1
    assert h_res2.json()[0]["title"] == "Dr. Sharma Prescription"

    # Delete record
    del_res = client.delete(f"/api/v1/patients/{patient_id}/history/{record_id}")
    assert del_res.status_code == 200

    # Verify empty again
    h_res3 = client.get(f"/api/v1/patients/{patient_id}/history")
    assert len(h_res3.json()) == 0

def test_forgot_password_flow():
    # Register patient
    client.post("/api/v1/auth/register/patient", json={
        "full_name": "Manoj Verma",
        "phone": "+919876500004",
        "password": "OldPassword123!",
        "gender": "Male",
        "consent_granted": True
    })

    # Reset password
    reset_res = client.post("/api/v1/auth/forgot-password", json={
        "identifier": "+919876500004",
        "new_password": "NewSecretPassword456!"
    })
    assert reset_res.status_code == 200

    # Login with new password
    login_res = client.post("/api/v1/auth/login", json={
        "identifier": "+919876500004",
        "password": "NewSecretPassword456!"
    })
    assert login_res.status_code == 200

def test_abdm_verify_abha():
    res = client.post("/api/v1/abdm/verify-abha", json={"abha_id": "91-4521-8890-1234"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
