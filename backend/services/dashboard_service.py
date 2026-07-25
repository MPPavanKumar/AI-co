"""
Service layer for aggregated Dashboard metrics, active assets, roadmap progress, and unified activity feed.
"""
import uuid
import logging
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.resume import ResumeAnalysis
from models.job_description import JobDescription
from models.job_match import JobMatch
from models.interview import InterviewSession
from models.learning_roadmap import LearningRoadmap

logger = logging.getLogger(__name__)


class DashboardService:

    @staticmethod
    async def get_dashboard_summary(
        db: AsyncSession, user_id: uuid.UUID
    ) -> dict:
        """Calculate counts, average & latest scores, active assets, and build unified activity feed."""
        # 1. Total Resumes, Avg & Latest ATS Score
        res_stmt = select(
            func.count(ResumeAnalysis.id),
            func.avg(ResumeAnalysis.ats_score)
        ).where(ResumeAnalysis.user_id == user_id)
        res_res = await db.execute(res_stmt)
        res_row = res_res.one()
        total_resumes = res_row[0] or 0
        avg_ats_score = int(res_row[1]) if res_row[1] is not None else None

        # Fetch Active / Latest Resume
        latest_res_stmt = (
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .limit(1)
        )
        latest_res_res = await db.execute(latest_res_stmt)
        active_resume_obj = latest_res_res.scalar_one_or_none()

        active_resume = None
        resume_score = None
        if active_resume_obj:
            resume_score = active_resume_obj.ats_score
            active_resume = {
                "id": active_resume_obj.id,
                "filename": active_resume_obj.filename,
                "ats_score": active_resume_obj.ats_score,
                "created_at": active_resume_obj.created_at,
            }

        # 2. Total JDs
        jd_stmt = select(func.count(JobDescription.id)).where(JobDescription.user_id == user_id)
        jd_res = await db.execute(jd_stmt)
        total_jds = jd_res.scalar_one_or_none() or 0

        # 3. Total Job Matches, Avg Match Score & Latest Match Score
        match_stmt = select(
            func.count(JobMatch.id),
            func.avg(JobMatch.match_score)
        ).where(JobMatch.user_id == user_id)
        match_res = await db.execute(match_stmt)
        match_row = match_res.one()
        avg_match_score = int(match_row[1]) if match_row[1] is not None else None

        latest_match_stmt = (
            select(JobMatch)
            .where(JobMatch.user_id == user_id)
            .order_by(desc(JobMatch.created_at))
            .limit(1)
        )
        latest_match_res = await db.execute(latest_match_stmt)
        latest_match_obj = latest_match_res.scalar_one_or_none()
        latest_job_match_score = latest_match_obj.match_score if latest_match_obj else None

        # 4. Total Interview Sessions & Avg Interview Score
        int_stmt = select(
            func.count(InterviewSession.id),
            func.avg(InterviewSession.overall_score)
        ).where(InterviewSession.user_id == user_id)
        int_res = await db.execute(int_stmt)
        int_row = int_res.one()
        total_interviews = int_row[0] or 0
        avg_interview_score = int(int_row[1]) if int_row[1] is not None else None

        # 5. Active Learning Roadmap & Upcoming Learning Tasks
        latest_rm_stmt = (
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == user_id)
            .order_by(desc(LearningRoadmap.created_at))
            .limit(1)
        )
        latest_rm_res = await db.execute(latest_rm_stmt)
        active_rm_obj = latest_rm_res.scalar_one_or_none()

        active_roadmap = None
        learning_progress_percentage = 0
        upcoming_learning_tasks = []

        if active_rm_obj:
            learning_progress_percentage = active_rm_obj.progress_percentage
            active_roadmap = {
                "id": active_rm_obj.id,
                "target_role": active_rm_obj.target_role,
                "progress_percentage": active_rm_obj.progress_percentage,
                "status": active_rm_obj.status,
                "created_at": active_rm_obj.created_at,
            }

            # Extract upcoming tasks from active week
            current_week_idx = min(3, active_rm_obj.progress_percentage // 25)
            if active_rm_obj.weekly_plan and len(active_rm_obj.weekly_plan) > current_week_idx:
                week_data = active_rm_obj.weekly_plan[current_week_idx]
                week_num = week_data.get("week", current_week_idx + 1)
                week_title = week_data.get("title", f"Week {week_num} Focus")
                objectives = week_data.get("objectives", [])
                for obj in objectives[:4]:
                    upcoming_learning_tasks.append({
                        "week": week_num,
                        "title": week_title,
                        "objective": obj,
                        "is_completed": active_rm_obj.progress_percentage >= (week_num * 25),
                    })

        # 6. Build Unified Recent Activity Feed
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

        # Recent Roadmaps
        recent_roadmaps = await db.execute(
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == user_id)
            .order_by(desc(LearningRoadmap.updated_at))
            .limit(5)
        )
        for rm in recent_roadmaps.scalars().all():
            activities.append({
                "id": rm.id,
                "type": "roadmap",
                "title": f"Learning Roadmap ({rm.target_role})",
                "score": rm.progress_percentage,
                "timestamp": rm.updated_at,
            })

        # Sort combined activity feed by timestamp descending
        activities.sort(key=lambda x: x["timestamp"], reverse=True)

        return {
            "total_resumes": total_resumes,
            "total_jds": total_jds,
            "total_interviews": total_interviews,
            "resume_score": resume_score,
            "avg_ats_score": avg_ats_score,
            "latest_job_match_score": latest_job_match_score,
            "avg_match_score": avg_match_score,
            "interviews_completed": total_interviews,
            "avg_interview_score": avg_interview_score,
            "learning_progress_percentage": learning_progress_percentage,
            "active_resume": active_resume,
            "active_roadmap": active_roadmap,
            "upcoming_learning_tasks": upcoming_learning_tasks,
            "recent_activity": activities[:10],
        }
