"""
Resume Analyzer & Resume Management router — upload, analyze, rename, set active, retrieve, delete.
"""
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.resume import (
    ResumeAnalysisResponse,
    ResumeListItem,
    AnalysisStatus,
    ResumeRenameRequest,
    ResumeSetActiveRequest,
)
from services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["Resume Analyzer & Management"])


@router.post(
    "/upload",
    response_model=AnalysisStatus,
    status_code=status.HTTP_201_CREATED,
    summary="Upload a PDF resume and get AI analysis",
)
async def upload_resume(
    file: UploadFile = File(..., description="PDF resume file (max 5 MB)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalysisStatus:
    """Upload a PDF resume. Analyzes with AI and stores as active if first resume."""
    analysis = await ResumeService.upload_and_analyze(
        db=db,
        user_id=current_user.id,
        file=file,
    )
    return AnalysisStatus(
        message="Resume analyzed successfully!",
        analysis=ResumeAnalysisResponse.model_validate(analysis),
    )


@router.get(
    "/analyses",
    response_model=list[ResumeListItem],
    summary="Get all resume analyses for current user",
)
async def get_analyses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ResumeListItem]:
    """Return all past resume analyses (active first, then newest)."""
    analyses = await ResumeService.get_user_analyses(db, current_user.id)
    return [ResumeListItem.model_validate(a) for a in analyses]


@router.get(
    "/latest",
    response_model=ResumeAnalysisResponse | None,
    summary="Get active/latest resume analysis",
)
async def get_latest(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse | None:
    """Return active resume, or null if none exists."""
    analysis = await ResumeService.get_latest(db, current_user.id)
    if not analysis:
        return None
    return ResumeAnalysisResponse.model_validate(analysis)


@router.get(
    "/analyses/{analysis_id}",
    response_model=ResumeAnalysisResponse,
    summary="Get a specific resume analysis by ID",
)
@router.get(
    "/{analysis_id}",
    response_model=ResumeAnalysisResponse,
    include_in_schema=False,
)
async def get_analysis(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse:
    """Return a specific analysis. 404 if not found or not owned by user."""
    analysis = await ResumeService.get_analysis_by_id(db, analysis_id, current_user.id)
    return ResumeAnalysisResponse.model_validate(analysis)


@router.patch(
    "/{analysis_id}/rename",
    response_model=ResumeAnalysisResponse,
    summary="Rename display_name of a resume",
)
async def rename_resume(
    analysis_id: uuid.UUID,
    data: ResumeRenameRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse:
    """Rename a resume's display name."""
    updated = await ResumeService.rename_resume(
        db=db, resume_id=analysis_id, user_id=current_user.id, display_name=data.display_name
    )
    return ResumeAnalysisResponse.model_validate(updated)


@router.patch(
    "/{analysis_id}/set-active",
    response_model=ResumeAnalysisResponse,
    summary="Set resume as active and unset all other user resumes",
)
async def set_active_resume(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse:
    """Set chosen resume as active."""
    updated = await ResumeService.set_active_resume(
        db=db, resume_id=analysis_id, user_id=current_user.id
    )
    return ResumeAnalysisResponse.model_validate(updated)


@router.delete(
    "/analyses/{analysis_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a resume analysis by ID",
)
@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
async def delete_analysis(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a resume analysis by ID."""
    await ResumeService.delete_analysis(db, analysis_id, current_user.id)
    return {"message": "Resume deleted successfully."}
