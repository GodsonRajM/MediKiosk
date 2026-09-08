from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings

# Import API Routers
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.sessions import router as sessions_router
from app.api.interviews import router as interviews_router
from app.api.documents import router as documents_router
from app.api.timeline import router as timeline_router
from app.api.red_flags import router as red_flags_router
from app.api.triage import router as triage_router
from app.api.ayush import router as ayush_router
from app.api.summaries import router as summaries_router
from app.api.doctors import router as doctors_router
from app.api.fhir import router as fhir_router
from app.api.abdm import router as abdm_router
from app.api.audit import router as audit_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MediKiosk Pre-Consultation AI-Assisted Patient Case-Taking Engine (SIH26047)",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(patients_router, prefix=api_v1_prefix)
app.include_router(sessions_router, prefix=api_v1_prefix)
app.include_router(interviews_router, prefix=api_v1_prefix)
app.include_router(documents_router, prefix=api_v1_prefix)
app.include_router(timeline_router, prefix=api_v1_prefix)
app.include_router(red_flags_router, prefix=api_v1_prefix)
app.include_router(triage_router, prefix=api_v1_prefix)
app.include_router(ayush_router, prefix=api_v1_prefix)
app.include_router(summaries_router, prefix=api_v1_prefix)
app.include_router(doctors_router, prefix=api_v1_prefix)
app.include_router(fhir_router, prefix=api_v1_prefix)
app.include_router(abdm_router, prefix=api_v1_prefix)
app.include_router(audit_router, prefix=api_v1_prefix)

@app.get("/")
@app.get("/health")
@app.get(f"{api_v1_prefix}/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "ai_provider": settings.AI_PROVIDER,
        "abdm_mode": settings.ABDM_MODE,
        "fhir_mode": settings.FHIR_MODE,
        "demo_mode": settings.DEMO_MODE,
        "privacy_notice": (
            "Designed with privacy-by-design principles and intended to align with applicable "
            "Indian data protection, ABDM consent, and healthcare security requirements. "
            "Production deployment requires formal security and compliance validation."
        )
    }
