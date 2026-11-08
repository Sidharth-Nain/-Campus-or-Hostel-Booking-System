"""Settings loaded from environment variables for the FastAPI application."""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration with safe defaults for local development."""

    app_name: str = "CampusReserve API"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str | None = None

    # The static Day 2 prototype can be served from either common local port.
    cors_origins: str = "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5173,http://localhost:5173"

    model_config = SettingsConfigDict(
        # Keep local secrets beside the backend, regardless of the terminal's cwd.
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured browser origins as a clean list."""

        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Create and cache application settings once per process."""

    return Settings()
