"""
AI Career Copilot router — send message, get history, get context summary, clear history.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from middleware.auth_middleware import get_current_user
from models.user import User
from schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatHistoryResponse,
    CopilotContextSummary,
)
from services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["AI Career Copilot"])


@router.post(
    "/send",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send prompt to AI Career Copilot and get response",
)
async def send_message(
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageResponse:
    """Send candidate prompt. Injects full candidate career context into AI request."""
    reply = await ChatService.send_message(
        db=db,
        user_id=current_user.id,
        message_text=payload.message,
        category=payload.category,
    )
    return ChatMessageResponse.model_validate(reply)


@router.get(
    "/history",
    response_model=ChatHistoryResponse,
    summary="Get conversation history for current user",
)
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatHistoryResponse:
    """Retrieve full conversation history in chronological order."""
    messages = await ChatService.get_chat_history(db, current_user.id)
    return ChatHistoryResponse(
        messages=[ChatMessageResponse.model_validate(m) for m in messages],
        total_count=len(messages),
    )


@router.get(
    "/context",
    response_model=CopilotContextSummary,
    summary="Get current candidate context summary being used by Copilot",
)
async def get_context(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CopilotContextSummary:
    """Return top banner summary of active resume, target role, match score, and interview count."""
    ctx = await ChatService.get_copilot_context(db, current_user.id)
    ats_val = int(ctx["ats_score"]) if ctx["ats_score"].isdigit() else None
    match_val = int(ctx["job_match_score"].replace("%", "")) if ctx["job_match_score"].replace("%", "").isdigit() else None

    return CopilotContextSummary(
        resume_name=ctx["resume_name"] if ctx["resume_name"] != "None uploaded" else None,
        ats_score=ats_val,
        target_role=ctx["roadmap_role"] if ctx["roadmap_role"] != "None generated yet" else None,
        match_score=match_val,
        interviews_completed=ctx["interviews_completed"],
        roadmap_progress=ctx["roadmap_progress"],
    )


@router.delete(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Clear conversation history for current user",
)
async def clear_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Clear conversation history."""
    await ChatService.clear_chat_history(db, current_user.id)
    return {"message": "Chat history cleared successfully."}
