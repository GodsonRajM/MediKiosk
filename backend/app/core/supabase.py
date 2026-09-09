import logging
from typing import Optional, Any
from app.core.config import settings

logger = logging.getLogger("medikiosk.supabase")

_supabase_client = None

def get_supabase_client() -> Optional[Any]:
    """
    Returns an initialized Supabase Client if credentials are configured in .env,
    otherwise returns None to run in clean local store mode with zero dummy data.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY:
        try:
            from supabase import create_client, Client
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
            logger.info("Successfully connected to live Supabase project at %s", settings.SUPABASE_URL)
            return _supabase_client
        except Exception as exc:
            logger.warning("Failed to initialize Supabase client: %s. Using clean local storage.", exc)
            return None
    return None
