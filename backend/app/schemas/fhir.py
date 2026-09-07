"""
FHIR R4 Schemas for ABDM Readiness.
"""
from typing import Dict, Any, List
from pydantic import BaseModel


class FHIRBundle(BaseModel):
    resourceType: str = "Bundle"
    id: str
    type: str = "document"
    timestamp: str
    entry: List[Dict[str, Any]]
