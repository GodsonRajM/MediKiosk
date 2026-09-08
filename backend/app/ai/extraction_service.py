from typing import Dict, Any, List
from app.ai.gemini_provider import get_ai_provider

class ExtractionService:
    def __init__(self):
        self.provider = get_ai_provider()

    async def extract_from_answer(self, raw_answer: str, section: str) -> List[Dict[str, Any]]:
        return await self.provider.extract_clinical_entities(raw_answer, section)

extraction_service = ExtractionService()
