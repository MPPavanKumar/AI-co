"""
Resume Analyzer router — upload, analyze, retrieve.
"""
import uuid
from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.resume import ResumeAnalysisResponse, ResumeListItem, AnalysisStatus
from services.resume_service import ResumeService

router = APIRouter(prefix="/resume", tags=["Resume Analyzer"])


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
    """
    Upload a PDF resume. The API will:
    1. Extract text using pdfplumber
    2. Send to OpenRouter API for analysis
    3. Return ATS score, skills, gaps, and suggestions
    """
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
    """Return all past resume analyses (newest first)."""
    analyses = await ResumeService.get_user_analyses(db, current_user.id)
    return [ResumeListItem.model_validate(a) for a in analyses]


@router.get(
    "/latest",
    response_model=ResumeAnalysisResponse | None,
    summary="Get the most recent resume analysis",
)
async def get_latest(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse | None:
    """Return the user's most recent analysis, or null if none exists."""
    analysis = await ResumeService.get_latest(db, current_user.id)
    if not analysis:
        return None
    return ResumeAnalysisResponse.model_validate(analysis)


@router.get(
    "/analyses/{analysis_id}",
    response_model=ResumeAnalysisResponse,
    summary="Get a specific resume analysis by ID",
)
async def get_analysis(
    analysis_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ResumeAnalysisResponse:
    """Return a specific analysis. 404 if not found or not owned by user."""
    analysis = await ResumeService.get_analysis_by_id(db, analysis_id, current_user.id)
    return ResumeAnalysisResponse.model_validate(analysis)
