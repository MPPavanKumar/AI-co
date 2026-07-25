"""
Pydantic schemas for Enhanced Dashboard metrics, active assets, upcoming learning tasks, and unified activity feed.
"""
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ActivityItem(BaseModel):
    id: UUID
    type: str  # "resume", "job_match", "interview", "roadmap"
    title: str
    score: Optional[int] = None
    timestamp: datetime


class ActiveResumeInfo(BaseModel):
    id: UUID
    filename: str
    ats_score: Optional[int] = None
    created_at: datetime


class ActiveRoadmapInfo(BaseModel):
    id: UUID
    target_role: str
    progress_percentage: int
    status: str
    created_at: datetime


class UpcomingTaskInfo(BaseModel):
    week: int
    title: str
    objective: str
    is_completed: bool = False


class DashboardSummaryResponse(BaseModel):
    # Core Counts & Scores
    total_resumes: int
    total_jds: int
    total_interviews: int
    
    resume_score: Optional[int] = None  # Latest ATS score
    avg_ats_score: Optional[int] = None
    latest_job_match_score: Optional[int] = None
    avg_match_score: Optional[int] = None
    interviews_completed: int = 0
    avg_interview_score: Optional[int] = None
    learning_progress_percentage: int = 0

    # Active Widgets
    active_resume: Optional[ActiveResumeInfo] = None
    active_roadmap: Optional[ActiveRoadmapInfo] = None
    upcoming_learning_tasks: List[UpcomingTaskInfo] = []

    # Unified Activity Timeline
    recent_activity: List[ActivityItem] = []
