"""
Clinical Extraction Service.
Coordinates NLP entity extraction via configured AIProvider.
"""
from typing import Dict, Any, Optional
from app.ai.gemini_client import get_ai_provider


class ExtractionService:
    @staticmethod
    async def extract_clinical_entities(text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        provider = get_ai_provider()
        return await provider.clinical_extraction.extract_entities(text, context)


extraction_service = ExtractionService()
