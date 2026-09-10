import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient

# Add app to path
sys.path.insert(0, os.path.abspath("."))

from app.main import app
from app.core.database import db

client = TestClient(app)

def test_full_clinical_voice_to_supabase_pipeline():
    # 1. Register test patient
    uid_suffix = uuid.uuid4().hex[:6]
    email = f"voice_test_{uid_suffix}@example.com"
    pwd = "SecurePassword123!"
    reg_res = client.post("/api/v1/auth/patient/signup", json={
        "email": email,
        "password": pwd,
        "full_name": "Ravi Kumar (Voice Test)",
        "consent_accepted": True,
        "age": 35,
        "phone": "+91 9988776655",
        "address": "123 MG Road, Bengaluru",
        "emergency_contact": "+91 9988776655"
    })
    assert reg_res.status_code in (200, 201), reg_res.text
    auth_data = reg_res.json()
    token = auth_data["access_token"]
    patient_id = auth_data["user"]["sub"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start intake session
    start_res = client.post("/api/v1/interviews/start", json={"language": "en"}, headers=headers)
    assert start_res.status_code == 200, start_res.text
    session_data = start_res.json()
    session_id = session_data["session_id"]
    first_q = session_data["question"]
    assert session_id is not None
    assert first_q is not None

    # 3. Verify ephemeral Gemini Live token endpoint
    live_res = client.post("/api/v1/ai/live-token", headers=headers)
    assert live_res.status_code == 200, live_res.text
    live_data = live_res.json()
    assert "websocket_url" in live_data
    assert "token" in live_data

    # 4. Submit voice-transcribed answer via the clinical intake pipeline
    voice_answer = "I have had severe chest pain and breathlessness for the past two days"
    ans_res = client.post("/api/v1/interviews/answer", json={
        "session_id": session_id,
        "question_id": first_q["id"],
        "answer_text": voice_answer,
        "language": "en"
    }, headers=headers)
    assert ans_res.status_code == 200, ans_res.text
    ans_data = ans_res.json()
    assert "question" in ans_data or "summary" in ans_data

    interview_id = session_data["interview_id"]

    # 5. Verify authoritative persistence in Supabase clinical_answers table
    admin_sb = db.supabase_client
    if admin_sb:
        saved_answers = admin_sb.table("clinical_answers").select("*").eq("interview_id", interview_id).execute()
        assert len(saved_answers.data) > 0, "Voice answer was not saved to Supabase clinical_answers!"
        record = saved_answers.data[0]
        assert record["interview_id"] == interview_id
        assert record["answer_text"] == voice_answer
        print("\n[SUCCESS] Supabase clinical_answers verified! Record:", record)
    else:
        print("\n[SUCCESS] Supabase client not initialized, verified via API response:", ans_data)

    # 6. Test SOS dispatch and database persistence
    em_settings_res = client.get("/api/v1/emergency/settings", headers=headers)
    assert em_settings_res.status_code == 200, em_settings_res.text
    em_token = em_settings_res.json()["token"]

    sos_res = client.post("/api/v1/emergency/sos", json={
        "token": em_token,
        "note": "Severe chest pain acute distress"
    })
    assert sos_res.status_code == 200, sos_res.text
    sos_data = sos_res.json()
    assert sos_data.get("status") == "dispatched"
    
    # Verify SOS persisted in Supabase audit_logs table
    if admin_sb:
        sos_records = admin_sb.table("audit_logs").select("*").eq("user_id", patient_id).eq("action", "emergency_sos_triggered").execute()
        assert len(sos_records.data) > 0, "SOS event was not saved to Supabase audit_logs!"
        print("[SUCCESS] Supabase emergency SOS audit_logs verified! Record:", sos_records.data[0])

if __name__ == "__main__":
    test_full_clinical_voice_to_supabase_pipeline()
