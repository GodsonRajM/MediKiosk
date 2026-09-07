"""
AI Service Abstraction Interfaces.
Defines clean contracts for AI providers so business logic remains decoupled from specific models.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class SpeechToTextProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        """Converts patient speech audio into text and detected language."""
        pass


class TextToSpeechProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "en") -> bytes:
        """Synthesizes question text into spoken audio."""
        pass


class DocumentOCRProvider(ABC):
    @abstractmethod
    async def extract_text_and_tables(self, file_bytes: bytes, mime_type: str) -> Dict[str, Any]:
        """Extracts raw text and bounding table data from medical documents/prescriptions."""
        pass


class ClinicalExtractionProvider(ABC):
    @abstractmethod
    async def extract_entities(self, text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Extracts structured medical entities (symptoms, drugs, labs, AYUSH markers) from text."""
        pass


class SummaryProvider(ABC):
    @abstractmethod
    async def generate_pre_consult_summary(
        self,
        patient_data: Dict[str, Any],
        interview_data: Dict[str, Any],
        document_entities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generates structured pre-consultation clinical summary for the physician."""
        pass


class AIProvider(ABC):
    """Unified container for all AI capabilities."""
    speech_to_text: SpeechToTextProvider
    text_to_speech: TextToSpeechProvider
    document_ocr: DocumentOCRProvider
    clinical_extraction: ClinicalExtractionProvider
    summary: SummaryProvider
