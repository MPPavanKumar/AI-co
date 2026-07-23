"""
FastAPI dependencies for JWT-based authentication.
Includes structured logging for auth failures to aid debugging.
"""
import logging
import uuid
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import get_db
from core.security import decode_access_token
from models.user import User

logger = logging.getLogger(__name__)

# Built-in HTTPBearer security scheme for Swagger UI Authorization and JWT dependency.
# auto_error=False: lets us return a clean 401 instead of FastAPI's default 403
# when the Authorization header is missing entirely.
bearer_scheme = HTTPBearer(
    description="Paste your JWT access token here (obtained from POST /api/v1/auth/login).",
    auto_error=False,
)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that validates a Bearer JWT token and returns the current user.

    Failure cases and their log messages:
    - Missing header    → 401 "No Authorization header"
    - Empty token       → 401 "Empty Bearer token"
    - Expired token     → 401 "Token has expired"
    - Bad signature     → 401 "Token signature invalid"
    - Missing 'sub'     → 401 "Token missing 'sub' claim"
    - Bad UUID in sub   → 401 "Token 'sub' is not a valid UUID"
    - User not found    → 401 "User not found in database"
    - User inactive     → 401 "User account is inactive"
    """
    method = request.method
    path = request.url.path

    def auth_failure(reason: str) -> HTTPException:
        logger.warning(
            "[AUTH FAILURE] %s %s — %s | "
            "Authorization header: %s | IP: %s",
            method, path, reason,
            "present" if credentials else "missing",
            request.client.host if request.client else "unknown",
        )
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── Step 1: Check header presence ────────────────────────────────────────
    if not credentials:
        raise auth_failure("No Authorization header")

    raw_token = credentials.credentials
    if not raw_token:
        raise auth_failure("Empty Bearer token")

    # ── Step 2: Decode and validate JWT ──────────────────────────────────────
    try:
        payload = jwt.decode(
            raw_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except ExpiredSignatureError:
        raise auth_failure("Token has expired")
    except JWTError as exc:
        raise auth_failure(f"Token signature invalid or malformed: {exc}")

    # ── Step 3: Validate 'sub' claim ──────────────────────────────────────────
    subject: Optional[str] = payload.get("sub")
    if not subject:
        raise auth_failure("Token missing 'sub' claim")

    try:
        user_id = uuid.UUID(subject)
    except ValueError:
        raise auth_failure(f"Token 'sub' is not a valid UUID: {subject!r}")

    # ── Step 4: Lookup user ────────────────────────────────────────────────────
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise auth_failure(f"User not found in database (id={user_id})")

    if not user.is_active:
        raise auth_failure(f"User account is inactive (id={user_id})")

    logger.info("[AUTH SUCCESS] %s %s — user_id=%s email=%s", method, path, user_id, user.email)
    return user
