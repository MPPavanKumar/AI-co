"""
Service layer for aggregated Dashboard metrics and unified activity feed.
"""
import uuid
import logging
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.resume import ResumeAnalysis
from models.job_description import JobDescription
from models.job_match import JobMatch
from models.interview import InterviewSession

logger = logging.getLogger(__name__)


class DashboardService:

    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession, user_id: uuid.UUID
    ) -> dict:
        """Calculate counts, average scores, and build unified recent activity feed."""
        # 1. Total Resumes & Avg ATS
        res_stmt = select(
            func.count(ResumeAnalysis.id),
            func.avg(ResumeAnalysis.ats_score)
        ).where(ResumeAnalysis.user_id == user_id)
        res_res = await db.execute(res_stmt)
        res_row = res_res.one()
        total_resumes = res_row[0] or 0
        avg_ats_score = int(res_row[1]) if res_row[1] is not None else None

        # 2. Total JDs
        jd_stmt = select(func.count(JobDescription.id)).where(JobDescription.user_id == user_id)
        jd_res = await db.execute(jd_stmt)
        total_jds = jd_res.scalar_one_or_none() or 0

        # 3. Total Job Matches & Avg Match Score
        match_stmt = select(
            func.count(JobMatch.id),
            func.avg(JobMatch.match_score)
        ).where(JobMatch.user_id == user_id)
        match_res = await db.execute(match_stmt)
        match_row = match_res.one()
        avg_match_score = int(match_row[1]) if match_row[1] is not None else None

        # 4. Total Interview Sessions & Avg Interview Score
        int_stmt = select(
            func.count(InterviewSession.id),
            func.avg(InterviewSession.overall_score)
        ).where(InterviewSession.user_id == user_id)
        int_res = await db.execute(int_stmt)
        int_row = int_res.one()
        total_interviews = int_row[0] or 0
        avg_interview_score = int(int_row[1]) if int_row[1] is not None else None

        # 5. Build Unified Recent Activity Feed
        activities = []

        # Recent Resumes
        recent_resumes = await db.execute(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .limit(5)
        )
        for r in recent_resumes.scalars().all():
            activities.append({
                "id": r.id,
                "type": "resume",
                "title": f"Resume Uploaded ({r.filename})",
                "score": r.ats_score,
                "timestamp": r.created_at,
            })

        # Recent Matches
        recent_matches = await db.execute(
            select(JobMatch)
            .where(JobMatch.user_id == user_id)
            .order_by(desc(JobMatch.created_at))
            .limit(5)
        )
        for m in recent_matches.scalars().all():
            activities.append({
                "id": m.id,
                "type": "job_match",
                "title": "Resume Job Match Analysis",
                "score": m.match_score,
                "timestamp": m.created_at,
            })

        # Recent Interviews
        recent_interviews = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(desc(InterviewSession.created_at))
            .limit(5)
        )
        for i in recent_interviews.scalars().all():
            activities.append({
                "id": i.id,
                "type": "interview",
                "title": f"Mock Interview ({i.role})",
                "score": i.overall_score,
                "timestamp": i.created_at,
            })

        # Sort combined activity feed by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        return {
            "total_resumes": total_resumes,
            "total_jds": total_jds,
            "total_interviews": total_interviews,
            "avg_ats_score": avg_ats_score,
            "avg_match_score": avg_match_score,
            "avg_interview_score": avg_interview_score,
            "recent_activity": activities[:10],
        }
