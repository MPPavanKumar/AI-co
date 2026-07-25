"""
FastAPI router for AI Learning Roadmap generation, progress tracking, and retrieval.
All endpoints protected by JWT authentication.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.roadmap import (
    RoadmapGenerateRequest,
    RoadmapProgressUpdate,
    RoadmapResponse,
)
from services.roadmap_service import RoadmapService

router = APIRouter(prefix="/roadmap", tags=["AI Learning Roadmap"])


@router.post(
    "/generate",
    response_model=RoadmapResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a personalized 4-week AI Learning Roadmap",
)
async def generate_learning_roadmap(
    data: RoadmapGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    return await RoadmapService.create_roadmap(
        db=db,
        user_id=current_user.id,
        target_role=data.target_role,
        resume_id=data.resume_id,
        job_match_id=data.job_match_id,
    )


@router.get(
    "",
    response_model=list[RoadmapResponse],
    summary="Get user's learning roadmap history",
)
@router.get(
    "/",
    response_model=list[RoadmapResponse],
    include_in_schema=False,
)
@router.get(
    "/roadmaps",
    response_model=list[RoadmapResponse],
    include_in_schema=False,
)
async def get_user_roadmaps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[RoadmapResponse]:
    return await RoadmapService.get_user_roadmaps(db=db, user_id=current_user.id)


@router.get(
    "/{roadmap_id}",
    response_model=RoadmapResponse,
    summary="Get a specific learning roadmap by ID",
)
async def get_roadmap_by_id(
    roadmap_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    return await RoadmapService.get_roadmap_by_id(
        db=db, roadmap_id=roadmap_id, user_id=current_user.id
    )


@router.patch(
    "/{roadmap_id}/progress",
    response_model=RoadmapResponse,
    summary="Update roadmap progress percentage (0-100%)",
)
async def update_roadmap_progress(
    roadmap_id: UUID,
    data: RoadmapProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoadmapResponse:
    return await RoadmapService.update_roadmap_progress(
        db=db,
        roadmap_id=roadmap_id,
        user_id=current_user.id,
        progress_percentage=data.progress_percentage,
        status_val=data.status,
    )


@router.delete(
    "/{roadmap_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a learning roadmap by ID",
)
async def delete_roadmap(
    roadmap_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await RoadmapService.delete_roadmap(
        db=db, roadmap_id=roadmap_id, user_id=current_user.id
    )
    return {"message": "Learning roadmap deleted successfully."}
