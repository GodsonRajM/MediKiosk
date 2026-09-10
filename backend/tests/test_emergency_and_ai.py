import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_emergency_settings_and_public_view_flow():
    uid = uuid.uuid4().hex[:6]
    # 1. Register a Patient
    p_reg = {
        "full_name": "Emergency Test Patient",
        "email": f"emergency.{uid}@hospital.org",
        "password": "EmergencyPass123!",
        "age": 28,
        "phone": "+919876500000",
        "address": "Bangalore",
        "blood_group": "AB+",
        "emergency_contact": "+919876500001",
        "consent_accepted": True
    }
    r_p = client.post("/api/v1/auth/patient/signup", json=p_reg)
    assert r_p.status_code == 201
    token = r_p.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Add allergy to test patient
    h_item = {
        "category": "allergy",
        "title": "Severe Penicillin Allergy",
        "details": {"severity": "anaphylaxis"}
    }
    r_add = client.post("/api/v1/patients/history", json=h_item, headers=headers)
    assert r_add.status_code == 201

    # 3. Retrieve emergency settings & secure token
    r_settings = client.get("/api/v1/emergency/settings", headers=headers)
    assert r_settings.status_code == 200
    s_data = r_settings.json()
    em_token = s_data["token"]
    assert em_token is not None
    assert len(em_token) >= 16
    assert s_data["blood_group"] == "AB+"
    assert s_data["emergency_contact"] == "+919876500001"
    assert "Severe Penicillin Allergy" in s_data["allergies"]

    # 4. Public emergency view (unauthenticated, scanned from another phone)
    r_view = client.get(f"/api/v1/emergency/view/{em_token}")
    assert r_view.status_code == 200
    v_data = r_view.json()
    assert v_data["status"] == "active"
    assert v_data["full_name"] == "Emergency Test Patient"
    assert v_data["blood_group"] == "AB+"
    assert "Severe Penicillin Allergy" in v_data["allergies"]

    # 5. Trigger SOS alert from public emergency portal
    sos_payload = {
        "token": em_token,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "note": "Immediate paramedic dispatch requested"
    }
    r_sos = client.post("/api/v1/emergency/sos", json=sos_payload)
    assert r_sos.status_code == 200
    sos_data = r_sos.json()
    assert sos_data["status"] == "dispatched"
    assert "108" in sos_data["emergency_contacts"]["ambulance"]

def test_gemini_live_token_endpoint_protection():
    # Without token -> 401 Unauthorized
    r_unauth = client.post("/api/v1/ai/live-token")
    assert r_unauth.status_code == 401

    # With valid patient auth token
    uid = uuid.uuid4().hex[:6]
    p_reg = {
        "full_name": "Voice Patient",
        "email": f"voice.{uid}@hospital.org",
        "password": "VoicePass123!",
        "age": 30,
        "phone": "+919876500002",
        "address": "Bangalore",
        "emergency_contact": "+919876500003",
        "consent_accepted": True
    }
    r_p = client.post("/api/v1/auth/patient/signup", json=p_reg)
    assert r_p.status_code == 201
    token = r_p.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Calling live-token endpoint checks backend GEMINI_API_KEY
    r_live = client.post("/api/v1/ai/live-token", headers=headers)
    # Either 200 (if valid key), or 502/503 explaining key status (never 500 unhandled crash)
    assert r_live.status_code in [200, 502, 503]
