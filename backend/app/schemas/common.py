"""
Common API Schemas and Envelope Types.
"""
from typing import Generic, TypeVar, Optional, Any, Dict
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class HealthStatus(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    demo_mode: bool
    ai_provider: str
    database: str
