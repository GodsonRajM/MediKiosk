import re
from typing import Dict, Any, List
from app.ai.base import BaseAIProvider

class MockAIProvider(BaseAIProvider):
    """
    Offline Mock AI Provider.
    Enables complete end-to-end evaluation, testing, and judge demonstrations
    with zero external API keys or network latency.
    """

    async def rephrase_question(self, question_text: str, context: Dict[str, Any], language: str) -> str:
        # Return friendly phrasing based on language
        if language == "ta":
            return f"தயவுசெய்து சொல்லுங்கள்: {question_text}"
        elif language == "hi":
            return f"कृपया बताइए: {question_text}"
        return f"Could you tell us: {question_text}"

    async def extract_clinical_entities(self, text: str, section: str) -> List[Dict[str, Any]]:
        entities = []
        lower = text.lower()

        # Medications recognition
        if any(w in lower for w in ["metformin", "glycomet"]):
            entities.append({
                "entity_type": "MEDICATION",
                "entity_name": "Metformin",
                "attributes": {"dosage": "500 mg", "frequency": "Twice daily", "route": "Oral"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })
        if any(w in lower for w in ["amlodipine", "stamlo"]):
            entities.append({
                "entity_type": "MEDICATION",
                "entity_name": "Amlodipine",
                "attributes": {"dosage": "5 mg", "frequency": "Once daily", "route": "Oral"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.95
            })

        # Conditions recognition
        if any(w in lower for w in ["diabetes", "sugar", "சர்க்கரை", "मधुमेह"]):
            entities.append({
                "entity_type": "CONDITION",
                "entity_name": "Type 2 Diabetes Mellitus",
                "attributes": {"status": "ACTIVE", "icd10": "E11.9"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.96
            })
        if any(w in lower for w in ["bp", "hypertension", "blood pressure", "இரத்த அழுத்தம்", "बीपी"]):
            entities.append({
                "entity_type": "CONDITION",
                "entity_name": "Essential Hypertension",
                "attributes": {"status": "ACTIVE", "icd10": "I10"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.96
            })

        # Allergies recognition
        if "penicillin" in lower:
            entities.append({
                "entity_type": "ALLERGY",
                "entity_name": "Penicillin",
                "attributes": {"reaction": "Urticaria/Rash", "severity": "MODERATE"},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.93
            })

        # Chief Complaint / Symptoms
        if any(w in lower for w in ["chest pain", "tightness", "heaviness"]):
            entities.append({
                "entity_type": "SYMPTOM",
                "entity_name": "Retrosternal Chest Heaviness",
                "attributes": {"location": "Substernal", "nature": "Pressure", "exertional": True},
                "source": "PATIENT_INTERVIEW",
                "confidence": 0.97
            })

        return entities

    async def process_document_ocr(self, document_text: str, doc_type: str) -> Dict[str, Any]:
        """Simulates OCR extraction on lab reports or prescriptions."""
        extracted_facts = {
            "document_type": doc_type,
            "raw_text_length": len(document_text),
            "investigations": [],
            "medications": [],
            "abnormalities_detected": []
        }

        # Check for HbA1c
        if "hba1c" in document_text.lower():
            extracted_facts["investigations"].append({
                "test_name": "HbA1c (Glycated Hemoglobin)",
                "result_value": "8.2",
                "unit": "%",
                "reference_range": "< 5.7 %",
                "is_abnormal": True,
                "confidence": 0.97,
                "source": "OCR"
            })
            extracted_facts["abnormalities_detected"].append("Elevated HbA1c (8.2%) indicates suboptimal glycemic control.")

        # Check for Creatinine
        if "creatinine" in document_text.lower():
            extracted_facts["investigations"].append({
                "test_name": "Serum Creatinine",
                "result_value": "1.0",
                "unit": "mg/dL",
                "reference_range": "0.7 - 1.3 mg/dL",
                "is_abnormal": False,
                "confidence": 0.99,
                "source": "OCR"
            })

        return extracted_facts

    async def generate_longitudinal_summary(self, session_data: Dict[str, Any], previous_records: Dict[str, Any]) -> Dict[str, Any]:
        chief_complaint = session_data.get("chief_complaint_text", "Chest pain on exertion")
        
        return {
            "chief_complaint_summary": f"Patient presents with {chief_complaint.lower()}.",
            "hpi_summary": "Retrosternal pressure and shortness of breath on exertion for the past 2 days, relieved by rest. Severity rated 6/10.",
            "past_history_summary": "Known history of Type 2 Diabetes Mellitus (8 years) and Essential Hypertension (6 years).",
            "medications_summary": "Metformin 500mg BD and Amlodipine 5mg OD with regular self-reported compliance.",
            "allergies_summary": "Prior record documents Penicillin allergy (2019). Flagged for physician confirmation.",
            "investigations_summary": "Recent HbA1c (8.2%) reflects uncontrolled glycemic control. Renal markers within normal limits.",
            "ayush_summary": "Prakriti: Pitta-Kapha. Vikriti: Prana Vata and Sadhaka Pitta disturbance. Ahara Shakti: Madhyama with sluggish digestion.",
            "contradictions_summary": "ALLERGY CONTRADICTION: Prior medical record notes Penicillin allergy; patient verbally stated 'no known allergies'. Doctor verification required.",
            "red_flags_summary": "CRITICAL: Priority clinical assessment recommended for new-onset exertional retrosternal chest pain with breathlessness in patient with vascular risk factors.",
            "evidence_links": [
                {"field": "Chief Complaint", "source": "PATIENT_INTERVIEW", "confidence": 0.95, "reference": "Voice intake CC_01"},
                {"field": "Metformin 500mg", "source": "PREVIOUS_RECORD", "confidence": 0.98, "reference": "Prescription record 2026"},
                {"field": "HbA1c 8.2%", "source": "OCR", "confidence": 0.97, "reference": "Uploaded Lab Report"},
                {"field": "Penicillin Contradiction", "source": "SYSTEM_RULE", "confidence": 1.0, "reference": "Allergy cross-check"}
            ]
        }

mock_ai_provider = MockAIProvider()
