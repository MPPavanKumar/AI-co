"""
InterviewSession ORM model — stores AI mock interview questions, candidate answers, code, and evaluations.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class InterviewSession(Base):
    """Stores an interactive AI mock interview session."""

    __tablename__ = "interview_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), default="Target Company")

    # Structured JSON stores:
    # questions: list of 5 questions (1 HR, 1 Tech, 3 DSA) with starter code templates
    # answers_and_feedback: list of per-question feedback, code, complexity, strengths, weaknesses
    questions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    answers_and_feedback: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    # Performance Scores
    overall_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hr_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    technical_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dsa_score: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Detailed Final Report Lists
    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    recommended_topics: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="in_progress", nullable=False)  # "in_progress", "completed"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<InterviewSession id={self.id} role={self.role} score={self.overall_score}>"
