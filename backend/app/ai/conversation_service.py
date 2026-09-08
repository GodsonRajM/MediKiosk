from typing import Dict, Any
from app.ai.gemini_provider import get_ai_provider

class ConversationService:
    def __init__(self):
        self.provider = get_ai_provider()

    async def get_conversational_question(self, question_text: str, context: Dict[str, Any], language: str) -> str:
        return await self.provider.rephrase_question(question_text, context, language)

conversation_service = ConversationService()
