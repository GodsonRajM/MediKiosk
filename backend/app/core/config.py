from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediKiosk"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    DEBUG: bool = True
    
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    SECRET_KEY: str = "medikiosk-secure-jwt-development-secret-key-sih2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SESSION_TIMEOUT_MINUTES: int = 30
    
    # Supabase credentials (optional for mock/in-memory mode)
    SUPABASE_URL: str = ""
    SUPABASE_SECRET_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""
    
    # AI Provider: "mock" or "gemini"
    AI_PROVIDER: str = "mock"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Interoperability Modes: "mock" or "real"
    ABDM_MODE: str = "mock"
    FHIR_MODE: str = "mock"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()
