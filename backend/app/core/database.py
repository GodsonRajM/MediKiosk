import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import settings
from app.core.supabase import get_supabase_client

class InMemoryDatabase:
    """
    High-performance in-memory database store initialized strictly with ZERO dummy data.
    All users, patients, doctors, medical history, and clinical sessions start empty
    and are populated dynamically through user interaction or Supabase synchronization.
    """
    def __init__(self):
        self.reset_to_clean_state()

    def reset_to_clean_state(self):
        # 1. Users (Auth credentials)
        self.users: Dict[str, Dict[str, Any]] = {}

        # 2. Patients & Identifiers
        self.patients: Dict[str, Dict[str, Any]] = {}
        self.patient_identifiers: List[Dict[str, Any]] = []

        # 3. Doctors & Relationships
        self.doctors: Dict[str, Dict[str, Any]] = {}
        self.doctor_patient_relationships: List[Dict[str, Any]] = []

        # 4. Patient Medical History (CRUD uploads, scans, prescriptions)
        self.medical_history: List[Dict[str, Any]] = []

        # 5. Clinical Sessions & Consents
        self.clinical_sessions: Dict[str, Dict[str, Any]] = {}
        self.consents: List[Dict[str, Any]] = []

        # 6. Structured Clinical Data
        self.medical_conditions: List[Dict[str, Any]] = []
        self.medications: List[Dict[str, Any]] = []
        self.allergies: List[Dict[str, Any]] = []
        self.investigations: List[Dict[str, Any]] = []

        # 7. Safety, Red Flags & Triage Alerts
        self.red_flags: List[Dict[str, Any]] = []
        self.triage_alerts: List[Dict[str, Any]] = []

        # 8. AYUSH Assessment & Longitudinal Summaries
        self.ayush_assessments: Dict[str, Dict[str, Any]] = {}
        self.summaries: Dict[str, Dict[str, Any]] = {}

        # 9. Medical Timeline & Documents
        self.medical_timeline: List[Dict[str, Any]] = []
        self.documents: List[Dict[str, Any]] = []

        # 10. Doctor Reviews & Audit Logs
        self.doctor_reviews: Dict[str, Dict[str, Any]] = {}
        self.audit_logs: List[Dict[str, Any]] = []

    # Sequence generators
    def next_patient_id(self) -> str:
        count = len(self.patients) + 10001
        return f"MK-P{count}"

    def next_doctor_id(self) -> str:
        count = len(self.doctors) + 10001
        return f"MK-D{count}"

    def sync_from_supabase_if_available(self):
        """
        Attempts to load real records from Supabase tables if configured.
        """
        client = get_supabase_client()
        if not client:
            return

        try:
            # Sync patients
            res = client.table("patients").select("*").execute()
            if res.data:
                for row in res.data:
                    self.patients[row["id"]] = row
            # Sync doctors
            d_res = client.table("doctors").select("*").execute()
            if d_res.data:
                for row in d_res.data:
                    self.doctors[row["id"]] = row
        except Exception:
            pass

db = InMemoryDatabase()
