from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "supabase_connected": bool(settings.SUPABASE_URL and (settings.SUPABASE_SECRET_KEY or settings.SUPABASE_ANON_KEY)),
        "gemini_connected": bool(settings.GEMINI_API_KEY),
        "zero_dummy_data": True,
        "privacy_notice": "MediKiosk implements privacy-by-design for OPD pre-consultation clinical intake."
    }
