from typing import Dict, Any
from app.ai.gemini_provider import get_ai_provider

class SummaryService:
    def __init__(self):
        self.provider = get_ai_provider()

    async def generate_summary(self, session_data: Dict[str, Any], previous_records: Dict[str, Any]) -> Dict[str, Any]:
        return await self.provider.generate_longitudinal_summary(session_data, previous_records)

summary_service = SummaryService()
