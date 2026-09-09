from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class DocumentEntityItem(BaseModel):
    entity_type: str
    entity_name: str
    entity_value: str
    confidence: float = 0.95
    verified: bool = False

class DocumentUploadResponse(BaseModel):
    document_id: str
    file_name: str
    ocr_status: str
    ocr_confidence: float
    extracted_text: Optional[str] = None
    entities: List[DocumentEntityItem] = []
    created_at: str
