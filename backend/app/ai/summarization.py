"""
Pre-Consultation Clinical Summarization Service.
"""
from typing import Dict, Any, List
from app.ai.gemini_client import get_ai_provider


class SummarizationService:
    @staticmethod
    async def generate_summary(
        patient_data: Dict[str, Any],
        interview_data: Dict[str, Any],
        document_entities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        provider = get_ai_provider()
        return await provider.summary.generate_pre_consult_summary(
            patient_data, interview_data, document_entities
        )


summarization_service = SummarizationService()
