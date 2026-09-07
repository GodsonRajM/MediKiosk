"""
Deterministic Mock AI Provider.
Enables immediate, 100% reliable execution and testing without requiring live Gemini API keys.
"""
from typing import Dict, Any, List, Optional
from app.ai.base import (
    AIProvider,
    SpeechToTextProvider,
    TextToSpeechProvider,
    DocumentOCRProvider,
    ClinicalExtractionProvider,
    SummaryProvider,
)


class MockSpeechToText(SpeechToTextProvider):
    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        return {
            "transcript": "I have been feeling pressure and pain in the middle of my chest when walking uphill for two days.",
            "detected_language": language or "en",
            "confidence": 0.95
        }


class MockTextToSpeech(TextToSpeechProvider):
    async def synthesize(self, text: str, language: str = "en") -> bytes:
        # Returns empty simulated audio buffer
        return b"RIFFmockwavcontent12345678"


class MockDocumentOCR(DocumentOCRProvider):
    async def extract_text_and_tables(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        return {
            "ocr_text": "APOLLO AYUSH & HEALTH CLINIC\nPatient: Murugan S. (52M) | Date: 20/02/2026\nDx: Essential Hypertension, T2DM\nRx: Metformin 500mg (1-0-1), Amlodipine 5mg (1-0-0)\nLabs: HbA1c: 8.2% (elevated), FBS: 164 mg/dL",
            "confidence": 0.98,
            "page_count": 1
        }


class MockClinicalExtraction(ClinicalExtractionProvider):
    async def extract_entities(self, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return {
            "symptoms": ["chest discomfort", "exertional heaviness", "breathlessness"],
            "medications": [
                {"name": "Metformin", "dose": "500 mg", "frequency": "twice daily"},
                {"name": "Amlodipine", "dose": "5 mg", "frequency": "once daily"}
            ],
            "investigations": [
                {"test_name": "HbA1c", "result": "8.2", "unit": "%", "abnormal": True},
                {"test_name": "Fasting Blood Sugar", "result": "164", "unit": "mg/dL", "abnormal": True}
            ],
            "ayush_markers": {
                "prakriti": "Pitta-Vata",
                "vikriti": "Vata Vriddhi",
                "agni": "Vishama",
                "koshtha": "Madhyama"
            }
        }


class MockSummaryProvider(SummaryProvider):
    async def generate_pre_consult_summary(
        self,
        patient_data: Dict[str, Any],
        interview_data: Dict[str, Any],
        document_entities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        name = patient_data.get("name", "Patient")
        age = patient_data.get("age", 50)
        gender = patient_data.get("gender", "male")
        cc = interview_data.get("chief_complaint", "Chest discomfort for 2 days")

        return {
            "chief_complaint": cc,
            "hpi": f"{age}-year-old {gender} ({name}) presents with a 2-day history of {cc}. Discomfort is retrosternal, exertional, and accompanied by breathlessness. History includes diagnosed Hypertension and Type 2 Diabetes Mellitus.",
            "known_conditions": ["Essential Hypertension (6 years)", "Type 2 Diabetes Mellitus (4 years)"],
            "current_medications": ["Metformin 500mg twice daily", "Amlodipine 5mg once daily"],
            "recent_investigations": ["HbA1c: 8.2% (poor glycemic control)", "Fasting Blood Sugar: 164 mg/dL"],
            "ayush_assessment": {
                "prakriti": "Pitta-Vata",
                "vikriti": "Vata-Kapha Vriddhi",
                "agni": "Vishama (Irregular)",
                "koshtha": "Madhyama"
            },
            "risk_stratification": "Priority Assessment: High Cardiovascular Risk Profile"
        }


class MockAIProvider(AIProvider):
    def __init__(self):
        self.speech_to_text = MockSpeechToText()
        self.text_to_speech = MockTextToSpeech()
        self.document_ocr = MockDocumentOCR()
        self.clinical_extraction = MockClinicalExtraction()
        self.summary = MockSummaryProvider()
