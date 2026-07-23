"""
Service layer for Job Descriptions and Resume-JD Matching operations.
Integrates directly with AIService (OpenRouter).
"""
import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.job_description import JobDescription
from models.job_match import JobMatch
from models.resume import ResumeAnalysis
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class JobService:

    @staticmethod
    async def parse_and_create_jd(
        db: AsyncSession,
        user_id: uuid.UUID,
        title: str,
        company_name: str | None,
        raw_text: str,
    ) -> JobDescription:
        """Parse raw JD text via AIService, extract skills/experience, and save to DB."""
        ai_service = get_ai_service()
        try:
            skills, _ = await ai_service.extract_skills(raw_text)
        except Exception as e:
            logger.warning("Skill extraction warning: %s", e)
            skills = []

        keywords = [s for s in skills[:10]]

        jd = JobDescription(
            user_id=user_id,
            title=title,
            company_name=company_name or "Target Company",
            raw_text=raw_text,
            extracted_skills=skills,
            required_experience="Not Specified",
            keywords=keywords,
        )
        db.add(jd)
        await db.flush()
        await db.refresh(jd)
        return jd

    @staticmethod
    async def get_user_jds(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 20
    ) -> list[JobDescription]:
        """Fetch all Job Descriptions saved by user."""
        result = await db.execute(
            select(JobDescription)
            .where(JobDescription.user_id == user_id)
            .order_by(desc(JobDescription.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_jd_by_id(
        db: AsyncSession, jd_id: uuid.UUID, user_id: uuid.UUID
    ) -> JobDescription:
        """Get a single JD owned by user."""
        result = await db.execute(
            select(JobDescription).where(
                JobDescription.id == jd_id, JobDescription.user_id == user_id
            )
        )
        jd = result.scalar_one_or_none()
        if not jd:
            raise HTTPException(status_code=404, detail="Job Description not found.")
        return jd

    @staticmethod
    async def delete_jd(
        db: AsyncSession, jd_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a Job Description by ID."""
        jd = await JobService.get_jd_by_id(db, jd_id, user_id)
        await db.delete(jd)
        await db.flush()
        return True

    @staticmethod
    async def analyze_resume_jd_match(
        db: AsyncSession,
        user_id: uuid.UUID,
        resume_id: uuid.UUID | None = None,
        jd_id: uuid.UUID | None = None,
        raw_jd_text: str | None = None,
    ) -> JobMatch:
        """Match candidate resume with target JD using AIService."""
        # 1. Fetch target resume (or latest if none specified)
        if resume_id:
            res_query = await db.execute(
                select(ResumeAnalysis).where(
                    ResumeAnalysis.id == resume_id, ResumeAnalysis.user_id == user_id
                )
            )
            resume = res_query.scalar_one_or_none()
            if not resume:
                raise HTTPException(status_code=404, detail="Specified resume analysis not found.")
        else:
            res_query = await db.execute(
                select(ResumeAnalysis)
                .where(ResumeAnalysis.user_id == user_id)
                .order_by(desc(ResumeAnalysis.created_at))
                .limit(1)
            )
            resume = res_query.scalar_one_or_none()
            if not resume:
                raise HTTPException(
                    status_code=400,
                    detail="No resume found. Please upload a resume first on the Resume Analyzer page.",
                )

        # 2. Get JD text
        target_jd_text = ""
        target_jd = None
        if jd_id:
            target_jd = await JobService.get_jd_by_id(db, jd_id, user_id)
            target_jd_text = target_jd.raw_text
        elif raw_jd_text and raw_jd_text.strip():
            target_jd_text = raw_jd_text.strip()
        else:
            raise HTTPException(status_code=400, detail="Please provide a stored jd_id or raw_jd_text.")

        # 3. Call AIService match feature
        ai_service = get_ai_service()
        try:
            match_data, _ = await ai_service.match_company_jd(
                resume_text=resume.extracted_text or "",
                jd_text=target_jd_text,
            )
        except Exception as e:
            logger.error("AI Match failed: %s", e)
            raise HTTPException(status_code=503, detail=f"AI Matching service error: {str(e)}") from e

        match_score = max(0, min(100, int(match_data.get("match_score", 0))))

        job_match = JobMatch(
            user_id=user_id,
            resume_id=resume.id,
            jd_id=target_jd.id if target_jd else None,
            match_score=match_score,
            matching_skills=match_data.get("matching_skills", []),
            missing_skills=match_data.get("missing_skills", []),
            fit_summary=match_data.get("fit_summary", ""),
            recommendations=match_data.get("recommendations", []),
        )
        db.add(job_match)
        await db.flush()
        await db.refresh(job_match)
        return job_match

    @staticmethod
    async def get_user_matches(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 20
    ) -> list[JobMatch]:
        """Get all match history for user."""
        result = await db.execute(
            select(JobMatch)
            .where(JobMatch.user_id == user_id)
            .order_by(desc(JobMatch.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())
