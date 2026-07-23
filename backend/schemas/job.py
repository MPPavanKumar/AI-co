"""
Pydantic schemas for Job Description parsing and Resume Matching.
"""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class JDParseRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255, description="Target job title")
    company_name: str | None = Field(default="Target Company", max_length=255)
    raw_text: str = Field(..., min_length=20, description="Job Description text content")


class JDResponse(BaseModel):
    id: UUID
    title: str
    company_name: str | None
    raw_text: str
    extracted_skills: list[str]
    required_experience: str | None
    keywords: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


class MatchAnalyzeRequest(BaseModel):
    resume_id: UUID | None = Field(default=None, description="ID of specific stored resume, or uses latest if None")
    jd_id: UUID | None = Field(default=None, description="ID of stored JD")
    raw_jd_text: str | None = Field(default=None, description="Raw JD text if not stored")


class JobMatchResponse(BaseModel):
    id: UUID
    resume_id: UUID
    jd_id: UUID | None
    match_score: int
    matching_skills: list[str]
    missing_skills: list[str]
    fit_summary: str | None
    recommendations: list[str]
    created_at: datetime

    class Config:
        from_attributes = True
