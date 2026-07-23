"""
ResumeAnalysis ORM model — stores uploaded resume metadata and AI analysis results.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.database import Base


class ResumeAnalysis(Base):
    """Stores a single resume upload + its AI-generated analysis."""

    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    # AI Analysis Results
    ats_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    skills_detected: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    missing_keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    strengths: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    suggestions: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    raw_gemini_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<ResumeAnalysis id={self.id} user_id={self.user_id} ats={self.ats_score}>"
