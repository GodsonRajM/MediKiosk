from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    @abstractmethod
    async def rephrase_question(self, question_text: str, context: Dict[str, Any], language: str) -> str:
        """Phrases clinical questions in warm, patient-friendly vernacular language."""
        pass

    @abstractmethod
    async def extract_clinical_entities(self, text: str, section: str) -> List[Dict[str, Any]]:
        """Extracts structured entities with confidence and source tags."""
        pass

    @abstractmethod
    async def process_document_ocr(self, document_text: str, doc_type: str) -> Dict[str, Any]:
        """Parses medical documents (prescriptions/labs) into structured facts."""
        pass

    @abstractmethod
    async def generate_longitudinal_summary(self, session_data: Dict[str, Any], previous_records: Dict[str, Any]) -> Dict[str, Any]:
        """Synthesizes current visit and historical facts into an evidence-linked summary."""
        pass
