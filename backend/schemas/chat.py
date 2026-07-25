"""
Pydantic schemas for AI Career Copilot API.
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ChatMessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Candidate message to Career Copilot")
    category: Optional[str] = Field(default="general", description="Message category or quick prompt topic")


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    sender: str
    message: str
    category: Optional[str] = "general"
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]
    total_count: int


class CopilotContextSummary(BaseModel):
    resume_name: Optional[str] = None
    ats_score: Optional[int] = None
    target_role: Optional[str] = None
    match_score: Optional[int] = None
    interviews_completed: int = 0
    roadmap_progress: int = 0
