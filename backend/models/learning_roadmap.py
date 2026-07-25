"""
LearningRoadmap ORM model — stores personalized AI learning plans, weekly targets, resources, and progress.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class LearningRoadmap(Base):
    """Stores personalized 4-week AI learning roadmaps for candidates."""

    __tablename__ = "learning_roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_analyses.id", ondelete="SET NULL"),
        nullable=True,
    )
    job_match_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_matches.id", ondelete="SET NULL"),
        nullable=True,
    )

    target_role: Mapped[str] = mapped_column(String(255), nullable=False)

    # Structured JSON storage:
    current_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weekly_plan: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    recommended_courses: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    learning_resources: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    practice_projects: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    estimated_completion_time: Mapped[str] = mapped_column(
        String(255), default="4 Weeks (10-12 hrs/week)", nullable=False
    )
    progress_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # "active", "completed", "archived"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<LearningRoadmap id={self.id} role={self.target_role} progress={self.progress_percentage}%>"
