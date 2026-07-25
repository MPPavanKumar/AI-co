"""
Pydantic schemas for the Resume Analyzer & Resume Management API.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ResumeRenameRequest(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=255, description="Custom display name for resume")


class ResumeSetActiveRequest(BaseModel):
    is_active: bool = Field(default=True, description="Set this resume as active")


class ResumeAnalysisResponse(BaseModel):
    """Full resume analysis result returned by the API."""
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    display_name: Optional[str] = None
    is_active: bool = False
    file_size: Optional[int] = None
    ats_score: Optional[int] = None
    skills_detected: list[str] = []
    missing_keywords: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []
    suggestions: list[str] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    """Lightweight item for the history list."""
    id: uuid.UUID
    filename: str
    display_name: Optional[str] = None
    is_active: bool = False
    file_size: Optional[int] = None
    ats_score: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AnalysisStatus(BaseModel):
    """Response after a successful upload + analysis."""
    message: str
    analysis: ResumeAnalysisResponse
