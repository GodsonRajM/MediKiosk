"""
Database Repository Layer.
Provides a unified interface with an in-memory repository for DEMO_MODE/development,
and Supabase client integration for live deployments.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.db.supabase import get_supabase_client


class InMemoryDatabase:
    """In-memory state store for Demo Mode and offline testing."""
    def __init__(self):
        self.patients: Dict[str, Dict[str, Any]] = {}
        self.users: Dict[str, Dict[str, Any]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.consents: Dict[str, List[Dict[str, Any]]] = {}
        self.interviews: Dict[str, Dict[str, Any]] = {}
        self.questions: Dict[str, List[Dict[str, Any]]] = {}
        self.answers: Dict[str, List[Dict[str, Any]]] = {}
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.document_entities: Dict[str, List[Dict[str, Any]]] = {}
        self.clinical_entities: Dict[str, List[Dict[str, Any]]] = {}
        self.medications: Dict[str, List[Dict[str, Any]]] = {}
        self.investigations: Dict[str, List[Dict[str, Any]]] = {}
        self.timeline: Dict[str, List[Dict[str, Any]]] = {}
        self.red_flags: Dict[str, List[Dict[str, Any]]] = {}
        self.summaries: Dict[str, Dict[str, Any]] = {}
        self.doctor_reviews: Dict[str, List[Dict[str, Any]]] = {}
        self.patient_access: Dict[str, List[Dict[str, Any]]] = {}
        self.audit_logs: List[Dict[str, Any]] = []
        
        self.seed_demo_data()

    def seed_demo_data(self):
        """Populates synthetic data for Demo Patient P001 and Doctor DOCTOR001."""
        now = datetime.now(timezone.utc).isoformat()
        
        # 1. Users
        doc_user_id = "doctor-001-uuid"
        self.users[doc_user_id] = {
            "id": doc_user_id,
            "role": "doctor",
            "name": "Dr. V. Rajesh, MD (Ayurveda)",
            "email": "dr.rajesh@ayush.hospital.gov.in",
            "phone": "+91-9876500001",
            "created_at": now
        }
        
        # 2. Patient P001
        p001_id = "11111111-1111-1111-1111-111111111111"
        self.patients[p001_id] = {
            "id": p001_id,
            "patient_code": "P001",
            "name": "Murugan S.",
            "date_of_birth": "1974-04-15",
            "age": 52,
            "gender": "male",
            "phone": "+91-9876543210",
            "abha_id": "91-1234-5678-9012",
            "preferred_language": "ta",
            "created_at": now,
            "updated_at": now
        }

        # 3. Patient P002 (Secondary demo case)
        p002_id = "22222222-2222-2222-2222-222222222222"
        self.patients[p002_id] = {
            "id": p002_id,
            "patient_code": "P002",
            "name": "Ananya Sharma",
            "date_of_birth": "1998-08-22",
            "age": 28,
            "gender": "female",
            "phone": "+91-9876543222",
            "abha_id": "91-2345-6789-0123",
            "preferred_language": "hi",
            "created_at": now,
            "updated_at": now
        }

        # 4. Consents for P001
        self.consents[p001_id] = [
            {"id": str(uuid.uuid4()), "patient_id": p001_id, "consent_type": "clinical_history", "status": "granted", "language": "ta", "consented_at": now},
            {"id": str(uuid.uuid4()), "patient_id": p001_id, "consent_type": "voice_processing", "status": "granted", "language": "ta", "consented_at": now},
            {"id": str(uuid.uuid4()), "patient_id": p001_id, "consent_type": "document_processing", "status": "granted", "language": "ta", "consented_at": now},
            {"id": str(uuid.uuid4()), "patient_id": p001_id, "consent_type": "doctor_sharing", "status": "granted", "language": "ta", "consented_at": now},
            {"id": str(uuid.uuid4()), "patient_id": p001_id, "consent_type": "abdm_exchange", "status": "granted", "language": "ta", "consented_at": now},
        ]

        # 5. Patient Access for Doctor 001
        self.patient_access[p001_id] = [
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "doctor_id": doc_user_id,
                "access_type": "encounter",
                "status": "approved",
                "granted_at": now,
                "expires_at": None,
                "reason": "Scheduled OPD clinical consultation"
            }
        ]

        # 6. Timeline for P001
        self.timeline[p001_id] = [
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "event_date": "2020-03-10",
                "event_type": "past_diagnosis",
                "title": "Hypertension Diagnosis",
                "description": "Essential hypertension diagnosed at Primary Health Center. Started on antihypertensives.",
                "source_type": "external_record"
            },
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "event_date": "2022-06-15",
                "event_type": "past_diagnosis",
                "title": "Type 2 Diabetes Mellitus",
                "description": "Diagnosed during annual health screening. Started on Metformin.",
                "source_type": "external_record"
            },
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "event_date": "2026-02-20",
                "event_type": "lab_test",
                "title": "HbA1c Blood Test",
                "description": "HbA1c: 8.2% (elevated glycemic control). Fasting blood sugar 164 mg/dL.",
                "source_type": "document"
            },
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "event_date": "2026-03-05",
                "event_type": "symptom_onset",
                "title": "Chest Discomfort Onset",
                "description": "Retrosternal pressure on exertion, relieved partially with rest.",
                "source_type": "interview"
            }
        ]

        # 7. Red Flags for P001
        self.red_flags[p001_id] = [
            {
                "id": str(uuid.uuid4()),
                "patient_id": p001_id,
                "interview_id": "interview-p001-uuid",
                "rule_code": "CHEST_PAIN_BREATHLESSNESS",
                "severity": "high",
                "message": "Priority clinical assessment recommended: Retrosternal exertional discomfort associated with breathlessness in patient with cardiovascular risk factors.",
                "status": "active",
                "created_at": now
            }
        ]

        # 8. Summary for P001
        summary_id = "summary-p001-uuid"
        self.summaries[summary_id] = {
            "id": summary_id,
            "patient_id": p001_id,
            "interview_id": "interview-p001-uuid",
            "content": {
                "chief_complaint": "Chest discomfort for 2 days",
                "hpi": "52-year-old male presenting with 2-day history of retrosternal heaviness radiating mildly to left arm, provoked by climbing stairs, partially relieved by rest. Reports associated mild breathlessness and diaphoresis.",
                "known_conditions": ["Hypertension (6 yrs)", "Type 2 Diabetes Mellitus (4 yrs)"],
                "current_medications": ["Metformin 500mg BD", "Amlodipine 5mg OD"],
                "recent_investigations": ["HbA1c: 8.2% (elevated)", "FBS: 164 mg/dL"],
                "ayush_assessment": {
                    "prakriti": "Pitta-Vata",
                    "vikriti": "Vata-Kapha Vriddhi",
                    "agni": "Vishama",
                    "koshtha": "Madhyama",
                    "vihara": "Sedentary occupational lifestyle"
                },
                "risk_stratification": "Elevated Cardiovascular Risk - Urgent Physician Evaluation Recommended"
            },
            "status": "under_review",
            "ai_generated": True,
            "doctor_verified": False,
            "created_at": now,
            "updated_at": now
        }


# Global in-memory instance for demo and tests
db = InMemoryDatabase()
