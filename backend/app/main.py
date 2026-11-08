"""Application entry point for the CampusReserve API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Backend API for the Smart Campus Facility Booking & Management System.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/", tags=["system"], summary="Describe the API service")
def root() -> dict[str, str]:
    """Provide a small landing response for a running local API."""

    return {
        "message": "CampusReserve API is running.",
        "documentation": "/docs",
        "health_check": f"{settings.api_v1_prefix}/health",
    }
