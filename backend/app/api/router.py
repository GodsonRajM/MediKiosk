"""
API v1 Router Aggregator.
Consolidates all feature endpoints into /api/v1.
"""
from fastapi import APIRouter
from app.api.routes import (
    health,
    auth,
    patients,
    consent,
    interviews,
    documents,
    summaries,
    timeline,
    access,
    fhir,
    audit
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(patients.router, tags=["Patients"])
api_router.include_router(consent.router, tags=["Consents"])
api_router.include_router(interviews.router, tags=["Interviews"])
api_router.include_router(documents.router, tags=["Documents"])
api_router.include_router(summaries.router, tags=["Summaries"])
api_router.include_router(timeline.router, tags=["Timeline"])
api_router.include_router(access.router, tags=["Access Control"])
api_router.include_router(fhir.router, tags=["FHIR"])
api_router.include_router(audit.router, tags=["Audit"])
