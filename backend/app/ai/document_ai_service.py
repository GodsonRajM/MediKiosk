from typing import Dict, Any
from app.ai.gemini_provider import get_ai_provider

class DocumentAIService:
    def __init__(self):
        self.provider = get_ai_provider()

    async def parse_document(self, text_content: str, doc_type: str = "LAB_REPORT") -> Dict[str, Any]:
        return await self.provider.process_document_ocr(text_content, doc_type)

document_ai_service = DocumentAIService()
