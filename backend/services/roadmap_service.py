"""
Service layer for AI Learning Roadmap operations.
Handles database CRUD, resume/job-match contextualization, and AIService integrations.
"""
import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.learning_roadmap import LearningRoadmap
from models.resume import ResumeAnalysis
from models.job_match import JobMatch
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class RoadmapService:

    @staticmethod
    async def create_roadmap(
        db: AsyncSession,
        user_id: uuid.UUID,
        target_role: str,
        resume_id: uuid.UUID | None = None,
        job_match_id: uuid.UUID | None = None,
    ) -> LearningRoadmap:
        """Analyze user resume & job match, generate AI roadmap, and store in database."""
        current_skills = []
        missing_skills = []
        resume_text = ""

        # 1. Fetch Resume Context if provided
        if resume_id:
            res_q = await db.execute(
                select(ResumeAnalysis).where(
                    ResumeAnalysis.id == resume_id, ResumeAnalysis.user_id == user_id
                )
            )
            resume = res_q.scalar_one_or_none()
            if resume:
                if resume.skills_detected:
                    current_skills.extend(resume.skills_detected)
                if resume.missing_keywords:
                    missing_skills.extend(resume.missing_keywords)
                resume_text = resume.extracted_text or ""

        # 2. Fetch Job Match Context if provided
        if job_match_id:
            jm_q = await db.execute(
                select(JobMatch).where(
                    JobMatch.id == job_match_id, JobMatch.user_id == user_id
                )
            )
            job_match = jm_q.scalar_one_or_none()
            if job_match:
                if job_match.matching_skills:
                    current_skills.extend(job_match.matching_skills)
                if job_match.missing_skills:
                    missing_skills.extend(job_match.missing_skills)

        # Deduplicate skill lists
        unique_current = list(dict.fromkeys(current_skills)) if current_skills else ["Problem Solving", "Software Architecture", "APIs"]
        unique_missing = list(dict.fromkeys(missing_skills)) if missing_skills else ["System Design", "Kubernetes", "Redis", "GraphQL", "CI/CD"]

        ai_service = get_ai_service()
        try:
            roadmap_data, _ = await ai_service.generate_personalized_learning_roadmap(
                target_role=target_role,
                current_skills=unique_current[:10],
                missing_skills=unique_missing[:10],
                resume_context=resume_text[:1000],
            )
        except Exception as e:
            logger.error("Failed to generate AI learning roadmap: %s", e)
            raise HTTPException(
                status_code=503, detail=f"Failed to generate AI learning roadmap: {str(e)}"
            ) from e

        roadmap = LearningRoadmap(
            user_id=user_id,
            resume_id=resume_id,
            job_match_id=job_match_id,
            target_role=target_role,
            current_skills=roadmap_data.get("current_skills", unique_current),
            missing_skills=roadmap_data.get("missing_skills", unique_missing),
            weekly_plan=roadmap_data.get("weekly_plan", []),
            recommended_courses=roadmap_data.get("recommended_courses", []),
            learning_resources=roadmap_data.get("learning_resources", []),
            practice_projects=roadmap_data.get("practice_projects", []),
            estimated_completion_time=roadmap_data.get("estimated_completion_time", "4 Weeks (10-12 hrs/week)"),
            progress_percentage=0,
            status="active",
        )

        db.add(roadmap)
        await db.flush()
        await db.commit()
        await db.refresh(roadmap)
        return roadmap

    @staticmethod
    async def get_user_roadmaps(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 20
    ) -> list[LearningRoadmap]:
        """Fetch all learning roadmaps created by user."""
        result = await db.execute(
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == user_id)
            .order_by(desc(LearningRoadmap.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_roadmap_by_id(
        db: AsyncSession, roadmap_id: uuid.UUID, user_id: uuid.UUID
    ) -> LearningRoadmap:
        """Fetch a single learning roadmap by ID."""
        result = await db.execute(
            select(LearningRoadmap).where(
                LearningRoadmap.id == roadmap_id, LearningRoadmap.user_id == user_id
            )
        )
        roadmap = result.scalar_one_or_none()
        if not roadmap:
            raise HTTPException(status_code=404, detail="Learning Roadmap not found.")
        return roadmap

    @staticmethod
    async def update_roadmap_progress(
        db: AsyncSession,
        roadmap_id: uuid.UUID,
        user_id: uuid.UUID,
        progress_percentage: int,
        status_val: str | None = None,
    ) -> LearningRoadmap:
        """Update progress percentage and completion status of a roadmap."""
        roadmap = await RoadmapService.get_roadmap_by_id(db, roadmap_id, user_id)
        roadmap.progress_percentage = max(0, min(100, int(progress_percentage)))
        if status_val:
            roadmap.status = status_val
        elif roadmap.progress_percentage == 100:
            roadmap.status = "completed"

        db.add(roadmap)
        await db.commit()
        await db.refresh(roadmap)
        return roadmap

    @staticmethod
    async def delete_roadmap(
        db: AsyncSession, roadmap_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a roadmap entry by ID."""
        roadmap = await RoadmapService.get_roadmap_by_id(db, roadmap_id, user_id)
        await db.delete(roadmap)
        await db.commit()
        return True
