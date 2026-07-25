"""
Pydantic schemas for AI Learning Roadmap generation, progress updates, and API responses.
"""
from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class RoadmapGenerateRequest(BaseModel):
    target_role: str = Field(..., min_length=2, max_length=255, description="Desired job role e.g. Senior Full Stack Engineer")
    resume_id: Optional[UUID] = Field(default=None, description="Optional Resume ID to analyze skills")
    job_match_id: Optional[UUID] = Field(default=None, description="Optional Job Match ID to analyze skill gaps")


class WeeklyPlanItem(BaseModel):
    week: int
    title: str
    description: str
    objectives: List[str] = Field(default_factory=list)


class RecommendedCourse(BaseModel):
    title: str
    provider: str
    link: Optional[str] = "#"
    focus: str


class LearningResource(BaseModel):
    title: str
    resource_type: str  # Documentation, Video, Practice Platform, Book, Tutorial
    description: str
    link: Optional[str] = "#"


class PracticeProject(BaseModel):
    title: str
    description: str
    tech_stack: List[str] = Field(default_factory=list)


class RoadmapProgressUpdate(BaseModel):
    progress_percentage: int = Field(..., ge=0, le=100, description="Updated progress 0-100%")
    status: Optional[str] = Field(default=None, description="active, completed, or archived")


class RoadmapResponse(BaseModel):
    id: UUID
    target_role: str
    resume_id: Optional[UUID] = None
    job_match_id: Optional[UUID] = None
    current_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    weekly_plan: List[WeeklyPlanItem] = Field(default_factory=list)
    recommended_courses: List[RecommendedCourse] = Field(default_factory=list)
    learning_resources: List[LearningResource] = Field(default_factory=list)
    practice_projects: List[PracticeProject] = Field(default_factory=list)
    estimated_completion_time: str = Field(default="4 Weeks (10-12 hrs/week)")
    progress_percentage: int = Field(default=0)
    status: str = Field(default="active")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
