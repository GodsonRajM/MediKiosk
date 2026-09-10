from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.doctors import router as doctors_router
from app.api.relationships import router as relationships_router
from app.api.interviews import router as interviews_router
from app.api.documents import router as documents_router
from app.api.summaries import router as summaries_router
from app.api.emergency import router as emergency_router
from app.api.admin import router as admin_router
from app.api.ai_live import router as ai_live_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Pre-consultation, AI-assisted patient case-taking system",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
api_v1_prefix = settings.API_V1_STR

app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(patients_router, prefix=api_v1_prefix)
app.include_router(doctors_router, prefix=api_v1_prefix)
app.include_router(relationships_router, prefix=api_v1_prefix)
app.include_router(interviews_router, prefix=api_v1_prefix)
app.include_router(documents_router, prefix=api_v1_prefix)
app.include_router(summaries_router, prefix=api_v1_prefix)
app.include_router(emergency_router, prefix=api_v1_prefix)
app.include_router(admin_router, prefix=api_v1_prefix)
app.include_router(ai_live_router, prefix=api_v1_prefix)

@app.get("/")
def root():
    return {
        "message": "MediKiosk API v2.0 is running",
        "docs": "/docs",
        "health": f"{api_v1_prefix}/health"
    }
