"""
MediKiosk FastAPI Modular Monolith Application Entry Point.
SIH 2026 - Problem SIH26047 - Ministry of Ayush.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import (
    MediKioskException,
    medikiosk_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.api.router import api_router


def create_application() -> FastAPI:
    app = FastAPI(
        title=f"{settings.PROJECT_NAME} API",
        description="Patient Case-Taking & Pre-Consultation Intelligence Platform for Ministry of Ayush (SIH26047)",
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json"
    )

    # CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception Handlers
    app.add_exception_handler(MediKioskException, medikiosk_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    # API v1 Router
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    async def startup_event():
        logger.info(
            f"MediKiosk Backend started. Environment: {settings.ENVIRONMENT}, "
            f"Demo Mode: {settings.DEMO_MODE}, AI Provider: {settings.AI_PROVIDER}"
        )

    return app


app = create_application()
