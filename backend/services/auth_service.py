"""
Authentication business logic — user creation, authentication, profile updates.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from models.user import User
from schemas.auth import RegisterRequest, ProfileUpdateRequest
from core.security import get_password_hash, verify_password


class AuthService:
    """Handles all authentication-related database operations."""

    @staticmethod
    async def create_user(db: AsyncSession, data: RegisterRequest) -> User:
        """
        Register a new user.
        Raises 409 if email already exists.
        """
        result = await db.execute(select(User).where(User.email == data.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = User(
            email=data.email,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            college=data.college,
            branch=data.branch,
            graduation_year=data.graduation_year,
        )
        db.add(user)
        await db.flush()      # Get generated ID without committing
        await db.refresh(user)  # Load server-generated defaults (timestamps, etc.)
        return user

    @staticmethod
    async def authenticate_user(
        db: AsyncSession, email: str, password: str
    ) -> User:
        """
        Authenticate user by email + password.
        Raises 401 on invalid credentials.
        """
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated.",
            )
        return user

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
        """Fetch user by primary key. Raises 404 if not found."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user

    @staticmethod
    async def update_profile(
        db: AsyncSession, user: User, data: ProfileUpdateRequest
    ) -> User:
        """Apply partial profile updates to an existing user."""
        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        await db.flush()
        await db.refresh(user)
        return user
