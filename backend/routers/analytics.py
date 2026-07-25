"""
Placement Analytics router — retrieves aggregated candidate placement metrics & readiness analytics.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.analytics import AnalyticsSummaryResponse
from services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Placement Analytics"])


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get aggregated executive placement readiness analytics",
)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsSummaryResponse:
    """
    Return candidate's Placement Readiness Dashboard Summary:
    - Weighted Placement Readiness Score (30% Resume + 30% Job Match + 20% Interview + 20% Roadmap)
    - Resume ATS trends & statistics
    - Job Match trends & statistics
    - Mock Interview performance trends & Competency Breakdown (HR, Technical, DSA, Comm, Problem Solving)
    - Learning Roadmap progress
    - Skill Mastery vs Skill Gap matrix
    - Recent Activity timeline
    - Deterministic Actionable Recommendations
    """
    return await AnalyticsService.get_analytics_summary(db, current_user.id)
