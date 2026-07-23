"""
FastAPI router for Dashboard summary analytics and recent activity feed.
All endpoints protected by JWT authentication.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.dashboard import DashboardSummaryResponse
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    summary="Get aggregated dashboard metrics and unified recent activity feed",
)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DashboardSummaryResponse:
    return await DashboardService.get_dashboard_summary(
        db=db, user_id=current_user.id
    )
