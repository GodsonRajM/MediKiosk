"""
Document OCR Engine.
Calls the configured AI OCR provider to transcribe document images or PDFs.
"""
from typing import Dict, Any
from app.ai.gemini_client import get_ai_provider


class DocumentOCREngine:
    @staticmethod
    async def process_file(file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        provider = get_ai_provider()
        return await provider.document_ocr.extract_text_and_tables(file_bytes, mime_type)


ocr_engine = DocumentOCREngine()
