"""
Supabase Client Integration.
Provides connections for Supabase Auth, PostgreSQL, and Private Storage.
"""
from typing import Optional
from supabase import create_client, Client
from app.core.config import settings
from app.core.logging import logger

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """Returns initialized Supabase client, or None if credentials not configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
        try:
            _supabase_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("Supabase client initialized successfully")
            return _supabase_client
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")
            return None
    return None
