"""
Async SQLAlchemy database engine and session management.
Supports Docker PostgreSQL (local), Neon PostgreSQL (production), and SQLite (fallback).
"""
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from .config import settings

db_url = settings.async_database_url
is_sqlite = settings.is_sqlite
is_postgres = settings.is_postgres

engine_kwargs = {
    "echo": settings.DEBUG,
    "pool_pre_ping": True,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif is_postgres:
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    if settings.ssl_required:
        engine_kwargs["connect_args"] = {"ssl": "require"}

engine = create_async_engine(db_url, **engine_kwargs)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
