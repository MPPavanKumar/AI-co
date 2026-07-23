"""
JobDescription ORM model — stores candidate target job descriptions and extracted AI metadata.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, ForeignKey, func, UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column
from core.database import Base


class JobDescription(Base):
    """Stores a single target Job Description uploaded or pasted by user."""

    __tablename__ = "job_descriptions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)

    # AI Extracted Metadata
    extracted_skills: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    required_experience: Mapped[str | None] = mapped_column(String(255), nullable=True)
    keywords: Mapped[list] = mapped_column(JSON, default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    def __repr__(self) -> str:
        return f"<JobDescription id={self.id} title={self.title} company={self.company_name}>"
