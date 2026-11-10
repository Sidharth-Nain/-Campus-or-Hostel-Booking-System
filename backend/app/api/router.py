"""Central place to register versioned API routes."""

from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.facilities import router as facilities_router
from app.api.routes.health import router as health_router


api_router = APIRouter()
api_router.include_router(health_router, tags=["system"])
api_router.include_router(facilities_router, tags=["facilities"])
api_router.include_router(auth_router, tags=["authentication"])
