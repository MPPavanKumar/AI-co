"""
FastAPI router for Job Description parsing, Resume-JD Matching, and JD deletion.
All endpoints protected by JWT authentication.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.job import (
    JDParseRequest,
    JDResponse,
    MatchAnalyzeRequest,
    JobMatchResponse,
)
from services.job_service import JobService

router = APIRouter(tags=["Job Description & Matching"])


@router.post(
    "/jd/parse",
    response_model=JDResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Parse and store a target Job Description",
)
async def parse_job_description(
    data: JDParseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JDResponse:
    return await JobService.parse_and_create_jd(
        db=db,
        user_id=current_user.id,
        title=data.title,
        company_name=data.company_name,
        raw_text=data.raw_text,
    )


@router.get(
    "/jd",
    response_model=list[JDResponse],
    summary="Get user's saved Job Descriptions",
)
async def get_user_job_descriptions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[JDResponse]:
    return await JobService.get_user_jds(db=db, user_id=current_user.id)


@router.get(
    "/jd/{jd_id}",
    response_model=JDResponse,
    summary="Get a specific Job Description by ID",
)
async def get_job_description_by_id(
    jd_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JDResponse:
    return await JobService.get_jd_by_id(db=db, jd_id=jd_id, user_id=current_user.id)


@router.delete(
    "/jd/{jd_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a Job Description by ID",
)
async def delete_job_description(
    jd_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await JobService.delete_jd(db=db, jd_id=jd_id, user_id=current_user.id)
    return {"message": "Job Description deleted successfully."}


@router.post(
    "/match/analyze",
    response_model=JobMatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze candidate resume against target Job Description",
)
async def analyze_job_match(
    data: MatchAnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobMatchResponse:
    return await JobService.analyze_resume_jd_match(
        db=db,
        user_id=current_user.id,
        resume_id=data.resume_id,
        jd_id=data.jd_id,
        raw_jd_text=data.raw_jd_text,
    )


@router.get(
    "/match/history",
    response_model=list[JobMatchResponse],
    summary="Get user's resume-JD match history",
)
async def get_user_match_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[JobMatchResponse]:
    return await JobService.get_user_matches(db=db, user_id=current_user.id)
