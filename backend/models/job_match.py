"""
JobMatch ORM model — stores candidate resume vs. job description AI match analysis.
"""
import uuid
from datetime import datetime
from sqlalchemy import Integer, Text, DateTime, ForeignKey, func, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class JobMatch(Base):
    """Stores candidate resume vs. Job Description match score and gap analysis."""

    __tablename__ = "job_matches"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_analyses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    jd_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_descriptions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Match Metrics
    match_score: Mapped[int] = mapped_column(Integer, nullable=False)
    matching_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    fit_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommendations: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<JobMatch id={self.id} score={self.match_score}>"
