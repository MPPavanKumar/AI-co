"""
Pydantic schemas for Placement Analytics API.
"""
from typing import Optional
from pydantic import BaseModel


class ScoreTrendPoint(BaseModel):
    date: str
    score: int
    label: str


class CompetencyBreakdown(BaseModel):
    hr: int
    technical: int
    dsa: int
    communication: int
    problem_solving: int


class SkillMasteredItem(BaseModel):
    skill: str
    frequency: int
    confidence: str


class SkillToImproveItem(BaseModel):
    skill: str
    frequency: int
    priority: str


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    timestamp: str
    detail: Optional[str] = None


class RecommendationItem(BaseModel):
    category: str
    action: str
    impact: str


class AnalyticsSummaryResponse(BaseModel):
    overall_readiness_score: int
    readiness_category: str  # "Excellent", "Good", "Average", "Needs Improvement"
    motivational_summary: str

    # Resume Stats
    current_ats: Optional[int] = None
    highest_ats: Optional[int] = None
    average_ats: Optional[int] = None
    ats_trend: list[ScoreTrendPoint] = []

    # Job Match Stats
    latest_job_match: Optional[int] = None
    highest_job_match: Optional[int] = None
    average_job_match: Optional[int] = None
    job_match_trend: list[ScoreTrendPoint] = []

    # Interview Stats
    average_interview_score: Optional[int] = None
    best_interview_score: Optional[int] = None
    total_interviews: int = 0
    interview_trend: list[ScoreTrendPoint] = []
    competency_breakdown: CompetencyBreakdown

    # Learning Stats
    learning_progress_percentage: int = 0
    completed_weeks: int = 0
    remaining_weeks: int = 4

    # Skill Intelligence
    mastered_skills: list[SkillMasteredItem] = []
    skills_to_improve: list[SkillToImproveItem] = []

    # Activity Counts & Timeline
    total_resumes_uploaded: int = 0
    total_job_matches: int = 0
    total_interviews_taken: int = 0
    total_roadmaps_generated: int = 0
    recent_activities: list[ActivityItem] = []

    # Recommendations
    recommendations: list[RecommendationItem] = []
