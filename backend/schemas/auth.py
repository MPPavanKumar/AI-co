"""
Pydantic schemas for authentication and user profile operations.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Request body for user registration."""
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=2, max_length=255)
    college: Optional[str] = Field(None, max_length=255)
    branch: Optional[str] = Field(None, max_length=100)
    graduation_year: Optional[int] = Field(None, ge=2020, le=2035)


class LoginRequest(BaseModel):
    """Request body for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user data returned in API responses."""
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    college: Optional[str]
    branch: Optional[str]
    graduation_year: Optional[int]
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response after successful login or registration."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdateRequest(BaseModel):
    """Request body for profile updates. All fields optional."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    college: Optional[str] = Field(None, max_length=255)
    branch: Optional[str] = Field(None, max_length=100)
    graduation_year: Optional[int] = Field(None, ge=2020, le=2035)
    avatar_url: Optional[str] = None


class MessageResponse(BaseModel):
    """Generic success message response."""
    message: str
