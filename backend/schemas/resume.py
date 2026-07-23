"""
Pydantic schemas for the Resume Analyzer API.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ResumeAnalysisResponse(BaseModel):
    """Full resume analysis result returned by the API."""
    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    file_size: Optional[int]
    ats_score: Optional[int]
    skills_detected: list[str]
    missing_keywords: list[str]
    strengths: list[str]
    weaknesses: list[str]
    suggestions: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumeListItem(BaseModel):
    """Lightweight item for the history list."""
    id: uuid.UUID
    filename: str
    ats_score: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisStatus(BaseModel):
    """Response after a successful upload + analysis."""
    message: str
    analysis: ResumeAnalysisResponse
