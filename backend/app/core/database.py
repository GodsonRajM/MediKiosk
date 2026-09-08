import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import settings

class InMemoryDatabase:
    """
    High-performance in-memory database store initialized with standard synthetic
    demonstration data for Problem Statement SIH26047. Used when SUPABASE_URL is not set.
    """
    def __init__(self):
        self.reset_to_defaults()

    def reset_to_defaults(self):
        # 1. Users
        self.users: Dict[str, Dict[str, Any]] = {
            "00000000-0000-0000-0000-000000000001": {
                "id": "00000000-0000-0000-0000-000000000001",
                "email": "patient@medikiosk.local",
                "phone": "+919876543210",
                "password_hash": "patient123",
                "role": "PATIENT",
                "is_active": True
            },
            "00000000-0000-0000-0000-000000000002": {
                "id": "00000000-0000-0000-0000-000000000002",
                "email": "doctor@medikiosk.local",
                "phone": "+919876543211",
                "password_hash": "doctor123",
                "role": "DOCTOR",
                "is_active": True
            },
            "00000000-0000-0000-0000-000000000003": {
                "id": "00000000-0000-0000-0000-000000000003",
                "email": "triage@medikiosk.local",
                "phone": "+919876543212",
                "password_hash": "triage123",
                "role": "TRIAGE_STAFF",
                "is_active": True
            },
            "00000000-0000-0000-0000-000000000004": {
                "id": "00000000-0000-0000-0000-000000000004",
                "email": "admin@medikiosk.local",
                "phone": "+919876543213",
                "password_hash": "admin123",
                "role": "ADMIN",
                "is_active": True
            }
        }

        # 2. Patients
        self.patients: Dict[str, Dict[str, Any]] = {
            "11111111-1111-1111-1111-111111111111": {
                "id": "11111111-1111-1111-1111-111111111111",
                "user_id": "00000000-0000-0000-0000-000000000001",
                "medikiosk_id": "MK-000001",
                "full_name": "Sundaram Ramaswamy",
                "date_of_birth": "1974-05-12",
                "age": 52,
                "gender": "Male",
                "phone": "+919876543210",
                "email": "sundaram.r@demo.local",
                "emergency_contact_name": "Meenakshi Ramaswamy",
                "emergency_contact_phone": "+919876543299",
                "preferred_language": "ta"
            }
        }

        # 3. Patient Identifiers
        self.patient_identifiers: List[Dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "identifier_type": "INTERNAL_MEDIKIOSK_ID", "identifier_value": "MK-000001", "issuing_system": "MediKiosk", "verified": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "identifier_type": "ABHA_NUMBER", "identifier_value": "91-4521-8890-1234", "issuing_system": "ABDM Sandbox", "verified": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "identifier_type": "ABHA_ADDRESS", "identifier_value": "sundaram.ramaswamy@abdm", "issuing_system": "ABDM Sandbox", "verified": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "identifier_type": "HOSPITAL_PATIENT_ID", "identifier_value": "GMC-OPD-9042", "issuing_system": "Govt Medical College Hospital", "verified": True}
        ]

        # 4. Clinical Sessions
        self.clinical_sessions: Dict[str, Dict[str, Any]] = {
            "22222222-2222-2222-2222-222222222222": {
                "id": "22222222-2222-2222-2222-222222222222",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "session_status": "READY_FOR_REVIEW",
                "mode": "AYUSH",
                "current_step": "SUMMARY",
                "selected_language": "ta",
                "chief_complaint_text": "Retrosternal chest tightness and breathlessness on exertion for past 2 days",
                "started_at": datetime.utcnow().isoformat(),
                "completed_at": None
            }
        }

        # 5. Consents
        self.consents: List[Dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "session_id": "22222222-2222-2222-2222-222222222222", "consent_type": "CLINICAL_HISTORY", "status": "GRANTED", "version": "1.0", "language": "ta", "audio_confirmation_recorded": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "session_id": "22222222-2222-2222-2222-222222222222", "consent_type": "VOICE_PROCESSING", "status": "GRANTED", "version": "1.0", "language": "ta", "audio_confirmation_recorded": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "session_id": "22222222-2222-2222-2222-222222222222", "consent_type": "MEDICAL_DOCUMENTS", "status": "GRANTED", "version": "1.0", "language": "ta", "audio_confirmation_recorded": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "session_id": "22222222-2222-2222-2222-222222222222", "consent_type": "DOCTOR_SHARING", "status": "GRANTED", "version": "1.0", "language": "ta", "audio_confirmation_recorded": True}
        ]

        # 6. Conditions, Medications, Allergies, Investigations
        self.medical_conditions: List[Dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "condition_name": "Type 2 Diabetes Mellitus", "icd10_code": "E11.9", "status": "ACTIVE", "diagnosed_year": 2018, "source": "PREVIOUS_RECORD", "confidence": 0.98, "doctor_verified": True},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "condition_name": "Essential Hypertension", "icd10_code": "I10", "status": "ACTIVE", "diagnosed_year": 2020, "source": "PREVIOUS_RECORD", "confidence": 0.98, "doctor_verified": True}
        ]

        self.medications: List[Dict[str, Any]] = [
            {"id": "med-001", "patient_id": "11111111-1111-1111-1111-111111111111", "drug_name": "Metformin", "dosage": "500 mg", "frequency": "Twice daily", "route": "Oral", "duration": "6 years", "status": "CURRENT", "source": "PREVIOUS_RECORD", "confidence": 0.96, "doctor_verified": True},
            {"id": "med-002", "patient_id": "11111111-1111-1111-1111-111111111111", "drug_name": "Amlodipine", "dosage": "5 mg", "frequency": "Once daily", "route": "Oral", "duration": "4 years", "status": "CURRENT", "source": "PREVIOUS_RECORD", "confidence": 0.96, "doctor_verified": True}
        ]

        self.allergies: List[Dict[str, Any]] = [
            {"id": "all-001", "patient_id": "11111111-1111-1111-1111-111111111111", "allergen": "Penicillin", "reaction_nature": "Urticaria and facial rash", "severity": "MODERATE", "source": "PREVIOUS_RECORD", "confidence": 0.95, "doctor_verified": True, "contradiction_flag": True, "contradiction_notes": "Hospital record notes Penicillin allergy; patient stated 'no allergies' during kiosk intake. Doctor verification required."}
        ]

        self.investigations: List[Dict[str, Any]] = [
            {"id": "inv-001", "patient_id": "11111111-1111-1111-1111-111111111111", "test_name": "HbA1c (Glycated Hemoglobin)", "result_value": "8.2", "unit": "%", "reference_range": "< 5.7", "is_abnormal": True, "test_date": "2026-06-15", "source": "OCR", "confidence": 0.97, "doctor_verified": True},
            {"id": "inv-002", "patient_id": "11111111-1111-1111-1111-111111111111", "test_name": "Serum Creatinine", "result_value": "1.0", "unit": "mg/dL", "reference_range": "0.7 - 1.3", "is_abnormal": False, "test_date": "2026-06-15", "source": "PREVIOUS_RECORD", "confidence": 0.99, "doctor_verified": True}
        ]

        # 7. Red Flags & Triage
        self.red_flags: List[Dict[str, Any]] = [
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "session_id": "22222222-2222-2222-2222-222222222222",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "rule_id": "RULE_CHEST_PAIN_EXERTIONAL_SOB",
                "severity": "CRITICAL",
                "title": "Exertional Retrosternal Chest Pain with Dyspnea",
                "clinical_recommendation": "Priority clinical assessment recommended. Immediate ECG and physician evaluation advised.",
                "triggered_criteria": ["chest_pain_location: retrosternal", "duration: 2 days", "exertional: true", "associated_symptom: breathlessness"],
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]

        self.triage_alerts: List[Dict[str, Any]] = [
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "red_flag_id": "33333333-3333-3333-3333-333333333333",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "patient_name": "Sundaram Ramaswamy",
                "medikiosk_id": "MK-000001",
                "severity": "CRITICAL",
                "reason": "Exertional Retrosternal Chest Pain with Dyspnea",
                "status": "ACTIVE",
                "action_taken": "Patient queued for priority ECG and triage assessment.",
                "created_at": datetime.utcnow().isoformat()
            }
        ]

        # 8. AYUSH Assessment
        self.ayush_assessments: Dict[str, Dict[str, Any]] = {
            "22222222-2222-2222-2222-222222222222": {
                "id": "55555555-5555-5555-5555-555555555555",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "session_id": "22222222-2222-2222-2222-222222222222",
                "prakriti": {"primary": "Pitta-Kapha", "vata_score": 25, "pitta_score": 45, "kapha_score": 30},
                "vikriti": {"imbalance": "Vata-Pitta", "dosha_status": "Prana Vata and Sadhaka Pitta disturbance indicated by chest heaviness"},
                "sara": "Madhyama",
                "samhanana": "Madhyama",
                "pramana": {"height_cm": 168, "weight_kg": 74, "bmi": 26.2, "assessment": "Madhyama"},
                "satmya": "Madhyama (Habituated to South Indian vegetarian diet)",
                "sattva": "Madhyama",
                "ahara_shakti": {"abhyavaharana_shakti": "Madhyama", "jarana_shakti": "Avara (Sluggish digestion)"},
                "vyayama_shakti": "Avara (Easily fatigued upon climbing stairs)",
                "vaya": "Madhyama (52 years)",
                "ahara_vihara": {
                    "meal_timing": "Irregular due to work schedule",
                    "appetite": "Moderate with mild post-prandial heaviness",
                    "food_preferences": "Pungent, warm, cooked vegetarian food",
                    "water_intake_liters": 2.0,
                    "daily_routine": "Wakes at 6:30 AM, sleeps around 11:30 PM",
                    "sleep_duration_hours": 6,
                    "sleep_quality": "Disturbed by chest discomfort over last two nights",
                    "physical_exercise": "Walking 15 mins daily; stopped recently due to shortness of breath"
                },
                "doctor_verified": False,
                "doctor_notes": ""
            }
        }

        # 9. Medical Timeline
        self.medical_timeline: List[Dict[str, Any]] = [
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2018-03-10", "event_type": "DIAGNOSIS", "title": "Type 2 Diabetes Mellitus Diagnosed", "description": "Fasting Blood Sugar 168 mg/dL; started Metformin 500mg.", "source": "PREVIOUS_RECORD", "confidence": 0.98},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2019-08-22", "event_type": "ALLERGY", "title": "Penicillin Hypersensitivity Incident", "description": "Urticaria and facial rash after Amoxicillin.", "source": "PREVIOUS_RECORD", "confidence": 0.95},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2020-11-05", "event_type": "DIAGNOSIS", "title": "Essential Hypertension Diagnosed", "description": "Blood pressure 150/94 mmHg; started Amlodipine 5mg OD.", "source": "PREVIOUS_RECORD", "confidence": 0.98},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2026-06-15", "event_type": "LAB_RESULT", "title": "HbA1c Lab Report (8.2%)", "description": "Suboptimal glycemic control (HbA1c 8.2%).", "source": "OCR", "confidence": 0.97},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2026-09-06", "event_type": "SYMPTOM", "title": "Onset of Exertional Chest Heaviness", "description": "Patient experienced retrosternal pressure on exertion.", "source": "PATIENT_INTERVIEW", "confidence": 0.94},
            {"id": str(uuid.uuid4()), "patient_id": "11111111-1111-1111-1111-111111111111", "event_date": "2026-09-08", "event_type": "RED_FLAG", "title": "Safety Alert: Exertional Chest Pain & Dyspnea", "description": "Priority clinical assessment recommended. Rule ID: RULE_CHEST_PAIN_EXERTIONAL_SOB.", "source": "SYSTEM_RULE", "confidence": 1.00}
        ]

        # 10. AI Longitudinal Summary
        self.summaries: Dict[str, Dict[str, Any]] = {
            "22222222-2222-2222-2222-222222222222": {
                "id": "66666666-6666-6666-6666-666666666666",
                "session_id": "22222222-2222-2222-2222-222222222222",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "chief_complaint_summary": "Retrosternal chest heaviness and breathlessness for past 2 days, provoked by physical exertion.",
                "hpi_summary": "Patient describes retrosternal tightness rated 6/10 that began 2 days ago. Symptoms worsen on climbing stairs or walking briskly and subside after 5-10 minutes of rest. Associated with mild dyspnea on exertion. Denies nausea, radiation to left arm, or diaphoresis.",
                "past_history_summary": "Known Type 2 Diabetes Mellitus (8 years) and Essential Hypertension (6 years).",
                "medications_summary": "Metformin 500 mg BD (oral, active), Amlodipine 5 mg OD (oral, active). Self-reported adherence is regular.",
                "allergies_summary": "Hospital records indicate Penicillin hypersensitivity (2019). During intake, patient responded 'no known allergies'. Flagged for doctor verification.",
                "investigations_summary": "Most recent HbA1c (June 2026): 8.2% (elevated, indicating uncontrolled glycemic index). Normal serum creatinine (1.0 mg/dL).",
                "ayush_summary": "Prakriti: Pitta-Kapha. Vikriti: Prana Vata and Sadhaka Pitta disturbance. Ahara Shakti: Madhyama with sluggish digestion (Jarana Shakti Avara). Sleep disturbed past 2 nights.",
                "contradictions_summary": "ALLERGY CONTRADICTION: Prior medical record notes severe Penicillin allergy (2019); patient verbally stated 'no allergies' during kiosk intake. Physician verification required.",
                "red_flags_summary": "CRITICAL SAFETY ALERT: Priority clinical assessment recommended due to new-onset exertional retrosternal chest pain with breathlessness in patient with cardiovascular risk factors (DM + HTN).",
                "evidence_links": [
                    {"field": "Chief Complaint", "source": "PATIENT_INTERVIEW", "confidence": 0.95, "reference": "Voice answer node CC_01"},
                    {"field": "Metformin 500mg", "source": "PREVIOUS_RECORD", "confidence": 0.98, "reference": "Prescription GMC-2026"},
                    {"field": "HbA1c 8.2%", "source": "OCR", "confidence": 0.97, "reference": "Lab Report Doc-0012"},
                    {"field": "Penicillin Contradiction", "source": "SYSTEM_RULE", "confidence": 1.0, "reference": "Allergy cross-check"}
                ],
                "is_finalized": False
            }
        }

        # 11. Documents
        self.documents: List[Dict[str, Any]] = [
            {
                "id": "doc-001",
                "patient_id": "11111111-1111-1111-1111-111111111111",
                "session_id": "22222222-2222-2222-2222-222222222222",
                "document_type": "LAB_REPORT",
                "file_name": "hba1c_lab_report_june2026.pdf",
                "file_path": "/sample-data/documents/hba1c_report.pdf",
                "mime_type": "application/pdf",
                "file_size_bytes": 142850,
                "ocr_raw_text": "GOVERNMENT MEDICAL COLLEGE & HOSPITAL\nDEPARTMENT OF BIOCHEMISTRY\nPATIENT: Sundaram Ramaswamy (Age 52/M) MK-000001\nTEST: Glycated Hemoglobin (HbA1c)\nRESULT: 8.2 %\nREFERENCE RANGE: Normal < 5.7 %, Prediabetic 5.7 - 6.4 %, Diabetic >= 6.5 %\nSERUM CREATININE: 1.0 mg/dL (Ref: 0.7 - 1.3 mg/dL)\nStatus: High Risk / Suboptimal Glycemic Control.",
                "ocr_status": "PROCESSED",
                "has_handwriting": False,
                "created_at": "2026-06-15T10:30:00Z"
            }
        ]

        # 12. Doctor Reviews
        self.doctor_reviews: Dict[str, Dict[str, Any]] = {}

        # 13. Audit Logs
        self.audit_logs: List[Dict[str, Any]] = []

db = InMemoryDatabase()
