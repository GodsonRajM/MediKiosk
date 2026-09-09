import pytest
import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["zero_dummy_data"] is True

def test_patient_registration_with_mandatory_consent():
    bad_req = {
        "full_name": "Test Patient",
        "email": "test.consent.patient@hospital.org",
        "password": "Password123!",
        "age": 45,
        "phone": "+919876543210",
        "address": "Bangalore, India",
        "emergency_contact": "+919876543211",
        "consent_accepted": False
    }
    r = client.post("/api/v1/auth/patient/signup", json=bad_req)
    assert r.status_code == 400
    assert "Mandatory consent" in r.json()["detail"]

    good_req = dict(bad_req)
    good_req["consent_accepted"] = True
    r2 = client.post("/api/v1/auth/patient/signup", json=good_req)
    assert r2.status_code == 201
    d2 = r2.json()
    assert "access_token" in d2
    assert d2["user"]["role"] == "patient"
    assert d2["user"]["medikiosk_id"].startswith("MK-")

def test_doctor_registration_and_login():
    doc_req = {
        "full_name": "Dr. Ananya Sharma",
        "email": "dr.ananya@hospital.org",
        "password": "DoctorSecure123!",
        "age": 38,
        "phone": "+919844433221",
        "address": "Chennai, India",
        "specialization": "Cardiology",
        "emergency_contact": "+919844433220",
        "consent_accepted": True
    }
    r = client.post("/api/v1/auth/doctor/signup", json=doc_req)
    assert r.status_code == 201
    d = r.json()
    doctor_id = d["user"]["doctor_id"]
    assert doctor_id.startswith("DK-")

    login_req = {
        "identifier": doctor_id,
        "password": "DoctorSecure123!"
    }
    r_login = client.post("/api/v1/auth/login", json=login_req)
    assert r_login.status_code == 200
    assert "access_token" in r_login.json()

def test_medical_history_crud_and_timeline():
    # 1. Register Patient
    p_reg = {
        "full_name": "Kavitha Nair",
        "email": "kavitha.nair@hospital.org",
        "password": "PatientPass123!",
        "age": 34,
        "phone": "+919812345678",
        "address": "Kochi, Kerala",
        "blood_group": "O+",
        "emergency_contact": "+919812345679",
        "consent_accepted": True
    }
    r_p = client.post("/api/v1/auth/patient/signup", json=p_reg)
    token = r_p.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify initial history is empty (ZERO fake records)
    r_init = client.get("/api/v1/patients/history", headers=headers)
    assert r_init.status_code == 200
    assert len(r_init.json()) == 0

    # Add History Item
    h_item = {
        "category": "allergy",
        "title": "Peanut and Penicillin Allergy",
        "details": {"severity": "moderate"}
    }
    r_add = client.post("/api/v1/patients/history", json=h_item, headers=headers)
    assert r_add.status_code == 201
    h_id = r_add.json()["id"]

    # Verify Timeline has entry
    r_time = client.get("/api/v1/patients/timeline", headers=headers)
    assert r_time.status_code == 200
    t_records = r_time.json()
    assert len(t_records) == 1
    assert "Peanut and Penicillin" in t_records[0]["title"]

    # Delete history item
    r_del = client.delete(f"/api/v1/patients/history/{h_id}", headers=headers)
    assert r_del.status_code == 200

    # Verify history is empty again
    r_after = client.get("/api/v1/patients/history", headers=headers)
    assert len(r_after.json()) == 0

def test_document_upload_and_ocr():
    p_reg = {
        "full_name": "Suresh Patel",
        "email": "suresh.patel@hospital.org",
        "password": "PatientPass123!",
        "age": 60,
        "phone": "+919712345670",
        "address": "Ahmedabad, Gujarat",
        "emergency_contact": "+919712345671",
        "consent_accepted": True
    }
    r_p = client.post("/api/v1/auth/patient/signup", json=p_reg)
    token = r_p.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload dummy prescription text file
    file_bytes = b"Rx: Metformin 500mg once daily for Type 2 Diabetes. Date: 2026-03-01"
    files = {"file": ("prescription_march.txt", io.BytesIO(file_bytes), "text/plain")}
    r_up = client.post("/api/v1/documents/upload", files=files, headers=headers)
    assert r_up.status_code == 201
    doc_data = r_up.json()
    assert doc_data["file_name"] == "prescription_march.txt"
    assert doc_data["ocr_status"] == "completed"

    # Verify timeline updated with document upload
    r_time = client.get("/api/v1/patients/timeline", headers=headers)
    assert any("prescription_march.txt" in t["title"] for t in r_time.json())

def test_unauthorized_doctor_access_blocked():
    # Patient 1
    p1 = client.post("/api/v1/auth/patient/signup", json={
        "full_name": "Private Patient",
        "email": "private.patient@hospital.org",
        "password": "SecretPassword123!",
        "age": 29,
        "phone": "+919833333333",
        "address": "Delhi",
        "emergency_contact": "+919833333334",
        "consent_accepted": True
    }).json()
    p1_id = p1["user"]["sub"]

    # Unrelated Doctor
    d_unrelated = client.post("/api/v1/auth/doctor/signup", json={
        "full_name": "Dr. Unrelated",
        "email": "dr.unrelated@hospital.org",
        "password": "DoctorPassword123!",
        "age": 42,
        "phone": "+919822222222",
        "address": "Mumbai",
        "specialization": "Dermatology",
        "emergency_contact": "+919822222223",
        "consent_accepted": True
    }).json()
    d_headers = {"Authorization": f"Bearer {d_unrelated['access_token']}"}

    # Attempt to open patient's clinical case without connection relationship -> Must be 403 Forbidden!
    r_forbidden = client.get(f"/api/v1/doctors/patients/{p1_id}/case", headers=d_headers)
    assert r_forbidden.status_code == 403
    assert "Access denied" in r_forbidden.json()["detail"]
