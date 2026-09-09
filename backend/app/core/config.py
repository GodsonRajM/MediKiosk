from pydantic_settings import BaseSettings
from pydantic import field_validator, ConfigDict
from typing import List, Union, Any
import os

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="allow")

    PROJECT_NAME: str = "MediKiosk"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        return v
    
    SECRET_KEY: str = "medikiosk-secure-jwt-production-secret-sih2026-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    
    # Supabase credentials (for authoritative cloud PostgreSQL, Auth, and Storage)
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    # Google Gemini AI credentials
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Interoperability modes
    ABDM_MODE: str = "adapter"
    FHIR_MODE: str = "adapter"

settings = Settings()
