"""
Health Check and System Readiness Endpoint.
"""
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.common import APIResponse, HealthStatus
from app.db.supabase import get_supabase_client

router = APIRouter()


@router.get("/health", response_model=APIResponse[HealthStatus])
async def check_health():
    supabase_connected = get_supabase_client() is not None
    status_data = HealthStatus(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        demo_mode=settings.DEMO_MODE,
        ai_provider=settings.AI_PROVIDER,
        database="supabase" if supabase_connected else "in_memory_demo"
    )
    return APIResponse(success=True, data=status_data, message="MediKiosk API service operational")
