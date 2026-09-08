import os
import json
from typing import Dict, Any, List
from app.ai.base import BaseAIProvider
from app.ai.mock_provider import mock_ai_provider
from app.core.config import settings

class GeminiAIProvider(BaseAIProvider):
    """
    Google Gemini Provider (1.5 Flash / 2.0).
    Wraps the official Gemini API and transparently falls back to mock provider
    if no API key is configured or if network calls encounter errors.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(self.model_name)
            except Exception:
                self._client = None

    async def rephrase_question(self, question_text: str, context: Dict[str, Any], language: str) -> str:
        if not self._client:
            return await mock_ai_provider.rephrase_question(question_text, context, language)
        try:
            prompt = f"Rephrase this medical intake question warmly and politely in {language}: '{question_text}'. Output only the rephrased question."
            response = self._client.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return await mock_ai_provider.rephrase_question(question_text, context, language)

    async def extract_clinical_entities(self, text: str, section: str) -> List[Dict[str, Any]]:
        if not self._client:
            return await mock_ai_provider.extract_clinical_entities(text, section)
        try:
            prompt = f"""Extract clinical entities from this patient answer in JSON array format:
Answer: "{text}"
Section: "{section}"
Each entity must have: entity_type (SYMPTOM, CONDITION, MEDICATION, ALLERGY), entity_name, attributes (dict), confidence (float between 0 and 1). Output pure JSON array only."""
            response = self._client.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```"):
                clean_text = clean_text.split("```")[1].strip()
                if clean_text.startswith("json"):
                    clean_text = clean_text[4:].strip()
            return json.loads(clean_text)
        except Exception:
            return await mock_ai_provider.extract_clinical_entities(text, section)

    async def process_document_ocr(self, document_text: str, doc_type: str) -> Dict[str, Any]:
        if not self._client:
            return await mock_ai_provider.process_document_ocr(document_text, doc_type)
        try:
            prompt = f"""Extract clinical findings, medications, and lab results from this OCR text:
{document_text}
Output JSON with: investigations (list of test_name, result_value, unit, reference_range, is_abnormal), medications (list), abnormalities_detected (list). Output pure JSON only."""
            response = self._client.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1].strip()
                if clean.startswith("json"):
                    clean = clean[4:].strip()
            return json.loads(clean)
        except Exception:
            return await mock_ai_provider.process_document_ocr(document_text, doc_type)

    async def generate_longitudinal_summary(self, session_data: Dict[str, Any], previous_records: Dict[str, Any]) -> Dict[str, Any]:
        if not self._client:
            return await mock_ai_provider.generate_longitudinal_summary(session_data, previous_records)
        try:
            prompt = f"""Synthesize this clinical session and history into an evidence-linked case summary:
Session: {json.dumps(session_data)}
History: {json.dumps(previous_records)}
Output JSON with: chief_complaint_summary, hpi_summary, past_history_summary, medications_summary, allergies_summary, investigations_summary, ayush_summary, contradictions_summary, red_flags_summary, evidence_links (list of field, source, confidence, reference). Output pure JSON only."""
            response = self._client.generate_content(prompt)
            clean = response.text.strip()
            if clean.startswith("```"):
                clean = clean.split("```")[1].strip()
                if clean.startswith("json"):
                    clean = clean[4:].strip()
            return json.loads(clean)
        except Exception:
            return await mock_ai_provider.generate_longitudinal_summary(session_data, previous_records)

def get_ai_provider() -> BaseAIProvider:
    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return GeminiAIProvider()
    return mock_ai_provider
