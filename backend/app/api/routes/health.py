"""System health route used to verify that the API is running."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import get_settings


router = APIRouter()


class HealthResponse(BaseModel):
    """Small, public response that does not expose configuration secrets."""

    status: str
    application: str
    environment: str


@router.get("/health", response_model=HealthResponse, summary="Check API health")
def health_check() -> HealthResponse:
    """Return a successful response when FastAPI has started."""

    settings = get_settings()
    return HealthResponse(
        status="ok",
        application=settings.app_name,
        environment=settings.environment,
    )
