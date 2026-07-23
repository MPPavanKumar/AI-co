"""
FastAPI router for AI Mock Interviews generation, evaluation, and session deletion.
All endpoints protected by JWT authentication.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.interview import (
    InterviewGenerateRequest,
    SingleQuestionEvaluateRequest,
    InterviewSessionResponse,
)
from services.interview_service import InterviewService

router = APIRouter(prefix="/interview", tags=["AI Mock Interviews"])


@router.post(
    "/generate",
    response_model=InterviewSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate AI Mock Interview questions and start session",
)
async def generate_interview_session(
    data: InterviewGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    return await InterviewService.create_interview_session(
        db=db,
        user_id=current_user.id,
        role=data.role,
        company_name=data.company_name,
        count=5,
        resume_id=data.resume_id,
        jd_id=data.jd_id,
    )


@router.post(
    "/{session_id}/evaluate-question",
    response_model=InterviewSessionResponse,
    summary="Evaluate a single question (text answer or DSA code) in real time",
)
async def evaluate_single_question(
    session_id: UUID,
    data: SingleQuestionEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    return await InterviewService.evaluate_single_question(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
        question_id=data.question_id,
        question=data.question,
        question_type=data.question_type,
        candidate_answer=data.candidate_answer,
        candidate_code=data.candidate_code,
        selected_language=data.selected_language,
        expected_key_points=data.expected_key_points,
    )


@router.post(
    "/{session_id}/complete",
    response_model=InterviewSessionResponse,
    summary="Complete interview session and generate final multi-metric report",
)
async def complete_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    return await InterviewService.complete_session(
        db=db,
        session_id=session_id,
        user_id=current_user.id,
    )


@router.get(
    "/sessions",
    response_model=list[InterviewSessionResponse],
    summary="Get user's mock interview session history",
)
async def get_user_interview_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InterviewSessionResponse]:
    return await InterviewService.get_user_sessions(db=db, user_id=current_user.id)


@router.get(
    "/{session_id}",
    response_model=InterviewSessionResponse,
    summary="Get a specific mock interview session by ID",
)
async def get_interview_session_by_id(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    return await InterviewService.get_session_by_id(
        db=db, session_id=session_id, user_id=current_user.id
    )


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a mock interview session by ID",
)
async def delete_interview_session(
    session_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await InterviewService.delete_session(
        db=db, session_id=session_id, user_id=current_user.id
    )
    return {"message": "Interview session deleted successfully."}
