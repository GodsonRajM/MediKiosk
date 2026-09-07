"""
Audio Transcription Service.
Uses configured AIProvider to transcribe audio input into text.
"""
from typing import Dict, Any
from app.ai.gemini_client import get_ai_provider


class TranscriptionService:
    @staticmethod
    async def transcribe_speech(audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        provider = get_ai_provider()
        return await provider.speech_to_text.transcribe(audio_bytes, language=language)


transcription_service = TranscriptionService()
