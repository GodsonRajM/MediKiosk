import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_auth_login():
    res = client.post("/api/v1/auth/login", json={"identifier": "MK-000001", "password": "patient123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["medikiosk_id"] == "MK-000001"

def test_get_patient():
    res = client.get("/api/v1/patients/11111111-1111-1111-1111-111111111111")
    assert res.status_code == 200
    data = res.json()
    assert data["full_name"] == "Sundaram Ramaswamy"
    assert data["medikiosk_id"] == "MK-000001"

def test_interview_next_question():
    res = client.get("/api/v1/interviews/22222222-2222-2222-2222-222222222222/next-question")
    assert res.status_code == 200
    data = res.json()
    assert "is_complete" in data

def test_doctor_queue():
    res = client.get("/api/v1/doctors/queue")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert data[0]["medikiosk_id"] == "MK-000001"
    assert data[0]["priority"] == "CRITICAL"

def test_triage_alerts():
    res = client.get("/api/v1/triage/alerts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert data[0]["severity"] == "CRITICAL"

def test_ayush_assessment():
    res = client.get("/api/v1/ayush/22222222-2222-2222-2222-222222222222")
    assert res.status_code == 200
    data = res.json()
    assert "prakriti" in data
    assert "ahara_vihara" in data

def test_fhir_bundle_endpoint():
    res = client.get("/api/v1/fhir/patient/11111111-1111-1111-1111-111111111111/bundle")
    assert res.status_code == 200
    bundle = res.json()
    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) >= 5

def test_abdm_verify_abha():
    res = client.post("/api/v1/abdm/verify-abha", json={"abha_id": "91-4521-8890-1234"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["full_name"] == "Sundaram Ramaswamy"
