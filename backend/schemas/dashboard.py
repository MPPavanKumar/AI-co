"""
Pydantic schemas for Dashboard metrics and recent activity feeds.
"""
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: UUID
    type: str  # "resume", "job_match", "interview"
    title: str
    score: int | None
    timestamp: datetime


class DashboardSummaryResponse(BaseModel):
    total_resumes: int
    total_jds: int
    total_interviews: int
    avg_ats_score: int | None
    avg_match_score: int | None
    avg_interview_score: int | None
    recent_activity: list[ActivityItem]
