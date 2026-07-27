"""
Application configuration using Pydantic Settings.
Reads from .env file and environment variables.
"""
from functools import lru_cache
from typing import List
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "CareerPilot AI"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"

    # Database — supports Docker local, Neon cloud, and SQLite formats
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # AI (OpenRouter)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL: str = "google/gemma-4-26b-a4b-it:free"

    @property
    def async_database_url(self) -> str:
        """
        Convert postgres://, postgresql://, or sqlite:// to async driver format.
        Strips unsupported libpq parameters (sslmode, channel_binding) for asyncpg driver compatibility.
        """
        url = self.DATABASE_URL.strip()

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            url = url.replace("sqlite://", "sqlite+aiosqlite://", 1)

        # Sanitize query parameters for asyncpg
        if "postgresql+asyncpg://" in url:
            parsed = urlparse(url)
            if parsed.query:
                query_params = parse_qs(parsed.query)
                # Remove libpq parameters unsupported by asyncpg
                query_params.pop("sslmode", None)
                query_params.pop("channel_binding", None)
                new_query = urlencode(query_params, doseq=True)
                url = urlunparse(parsed._replace(query=new_query))

        return url

    @property
    def is_sqlite(self) -> bool:
        """Check if current database is SQLite."""
        return self.async_database_url.startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        """Check if current database is PostgreSQL."""
        return self.async_database_url.startswith("postgresql+asyncpg")

    @property
    def ssl_required(self) -> bool:
        """
        Determine if SSL connection is required (e.g. for Neon PostgreSQL on Render).
        Returns True if sslmode was specified in DATABASE_URL or if host is a cloud provider like neon.tech.
        """
        raw = self.DATABASE_URL.lower()
        return (
            "sslmode=require" in raw
            or "sslmode=verify-ca" in raw
            or "sslmode=verify-full" in raw
            or "ssl=true" in raw
            or "ssl=require" in raw
            or "neon.tech" in raw
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
