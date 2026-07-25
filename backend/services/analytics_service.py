"""
Placement Analytics Service — aggregates deterministic analytics, trends, metrics, and recommendations.
Does not duplicate data or use AI for score calculations.
"""
import uuid
import logging
from collections import Counter
from sqlalchemy import select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from models.resume import ResumeAnalysis
from models.job_match import JobMatch
from models.interview import InterviewSession
from models.learning_roadmap import LearningRoadmap
from schemas.analytics import (
    AnalyticsSummaryResponse,
    ScoreTrendPoint,
    CompetencyBreakdown,
    SkillMasteredItem,
    SkillToImproveItem,
    ActivityItem,
    RecommendationItem,
)

logger = logging.getLogger(__name__)


class AnalyticsService:

    @staticmethod
    async def get_analytics_summary(
        db: AsyncSession, user_id: uuid.UUID
    ) -> AnalyticsSummaryResponse:
        """
        Aggregate candidate analytics across all 4 modules:
        1. Resume ATS Score History & Trends
        2. Job Match Score History & Trends
        3. Interview Scores & Competency Breakdown (HR, Technical, DSA, Communication, Problem Solving)
        4. Learning Roadmap Progress & Week Completion
        5. Skill Mastery & Gap Matrix
        6. Deterministic Overall Placement Readiness Calculation (Weighted)
        7. Deterministic Actionable Recommendations
        """
        # ── 1. Resume Analytics ───────────────────────────────────────────────
        resumes_q = await db.execute(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(asc(ResumeAnalysis.created_at))
        )
        resumes = list(resumes_q.scalars().all())

        total_resumes = len(resumes)
        ats_scores = [r.ats_score for r in resumes if r.ats_score is not None]

        active_resume = next((r for r in reversed(resumes) if r.is_active), None)
        if not active_resume and total_resumes > 0:
            active_resume = resumes[-1]

        current_ats = active_resume.ats_score if active_resume else (ats_scores[-1] if ats_scores else None)
        highest_ats = max(ats_scores) if ats_scores else None
        average_ats = round(sum(ats_scores) / len(ats_scores)) if ats_scores else None

        ats_trend = [
            ScoreTrendPoint(
                date=r.created_at.strftime("%d %b"),
                score=r.ats_score or 0,
                label=r.display_name or r.filename,
            )
            for r in resumes
            if r.ats_score is not None
        ]

        # Collect detected & missing skills
        all_detected_skills = []
        all_missing_skills = []
        for r in resumes:
            if r.skills_detected:
                all_detected_skills.extend(r.skills_detected)
            if r.missing_keywords:
                all_missing_skills.extend(r.missing_keywords)

        # ── 2. Job Match Analytics ────────────────────────────────────────────
        matches_q = await db.execute(
            select(JobMatch)
            .where(JobMatch.user_id == user_id)
            .order_by(asc(JobMatch.created_at))
        )
        matches = list(matches_q.scalars().all())

        total_job_matches = len(matches)
        match_scores = [m.match_score for m in matches if m.match_score is not None]

        latest_job_match = match_scores[-1] if match_scores else None
        highest_job_match = max(match_scores) if match_scores else None
        average_job_match = round(sum(match_scores) / len(match_scores)) if match_scores else None

        job_match_trend = [
            ScoreTrendPoint(
                date=m.created_at.strftime("%d %b"),
                score=m.match_score or 0,
                label=f"Match #{m.id.hex[:4]}",
            )
            for m in matches
            if m.match_score is not None
        ]

        for m in matches:
            if m.missing_skills:
                all_missing_skills.extend(m.missing_skills)

        # ── 3. Interview Analytics ───────────────────────────────────────────
        interviews_q = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(asc(InterviewSession.created_at))
        )
        interviews = list(interviews_q.scalars().all())

        total_interviews = len(interviews)
        interview_scores = [i.overall_score for i in interviews if i.overall_score is not None]

        average_interview_score = round(sum(interview_scores) / len(interview_scores)) if interview_scores else None
        best_interview_score = max(interview_scores) if interview_scores else None

        interview_trend = [
            ScoreTrendPoint(
                date=i.created_at.strftime("%d %b"),
                score=i.overall_score or 0,
                label=f"{i.role} ({i.company_name or 'Mock'})",
            )
            for i in interviews
            if i.overall_score is not None
        ]

        # Calculate Competency Breakdown
        hr_scores = [i.hr_score for i in interviews if i.hr_score is not None]
        tech_scores = [i.technical_score for i in interviews if i.technical_score is not None]
        dsa_scores = [i.dsa_score for i in interviews if i.dsa_score is not None]

        hr_avg = round(sum(hr_scores) / len(hr_scores)) if hr_scores else (average_interview_score or 0)
        tech_avg = round(sum(tech_scores) / len(tech_scores)) if tech_scores else (average_interview_score or 0)
        dsa_avg = round(sum(dsa_scores) / len(dsa_scores)) if dsa_scores else (average_interview_score or 0)
        comm_avg = round((hr_avg * 0.6 + (average_interview_score or 0) * 0.4)) if interview_scores else 0
        prob_avg = round((dsa_avg * 0.6 + tech_avg * 0.4)) if interview_scores else 0

        competency = CompetencyBreakdown(
            hr=min(100, max(0, hr_avg)),
            technical=min(100, max(0, tech_avg)),
            dsa=min(100, max(0, dsa_avg)),
            communication=min(100, max(0, comm_avg)),
            problem_solving=min(100, max(0, prob_avg)),
        )

        # ── 4. Learning Roadmap Analytics ──────────────────────────────────────
        roadmaps_q = await db.execute(
            select(LearningRoadmap)
            .where(LearningRoadmap.user_id == user_id)
            .order_by(desc(LearningRoadmap.created_at))
            .limit(1)
        )
        active_roadmap = roadmaps_q.scalar_one_or_none()

        roadmaps_count_q = await db.execute(
            select(LearningRoadmap).where(LearningRoadmap.user_id == user_id)
        )
        total_roadmaps = len(list(roadmaps_count_q.scalars().all()))

        learning_progress = active_roadmap.progress_percentage if active_roadmap else 0
        completed_weeks = round((learning_progress / 100) * 4)
        remaining_weeks = max(0, 4 - completed_weeks)

        # ── 5. Weighted Overall Placement Readiness ───────────────────────────
        # Formula: Resume ATS (30%) + Job Match (30%) + Interview Avg (20%) + Roadmap Progress (20%)
        res_val = current_ats or 0
        job_val = latest_job_match or 0
        int_val = average_interview_score or 0
        rdm_val = learning_progress or 0

        overall_readiness = round(res_val * 0.30 + job_val * 0.30 + int_val * 0.20 + rdm_val * 0.20)

        if overall_readiness >= 80:
            category = "Excellent"
            motivation = "🔥 Top-tier placement readiness! You are fully prepared to crack Tier-1 technical rounds."
        elif overall_readiness >= 65:
            category = "Good"
            motivation = "🚀 Strong candidate profile! Focus on refining DSA problem solving and closing minor skill gaps."
        elif overall_readiness >= 50:
            category = "Average"
            motivation = "📈 Steady progress! Take additional mock interviews and complete your active learning roadmap."
        else:
            category = "Needs Improvement"
            motivation = "🎯 Action required: Upload an active resume, analyze job matches, and follow your 4-week roadmap."

        # ── 6. Skill Intelligence ─────────────────────────────────────────────
        mastered_counter = Counter(all_detected_skills)
        mastered_skills = [
            SkillMasteredItem(
                skill=skill,
                frequency=count,
                confidence="High" if count >= 3 else ("Medium" if count == 2 else "Verified"),
            )
            for skill, count in mastered_counter.most_common(8)
        ]

        improve_counter = Counter(all_missing_skills)
        skills_to_improve = [
            SkillToImproveItem(
                skill=skill,
                frequency=count,
                priority="High Priority" if count >= 3 else ("Medium" if count == 2 else "Recommended"),
            )
            for skill, count in improve_counter.most_common(8)
        ]

        # ── 7. Unified Activity Timeline ──────────────────────────────────────
        activities: list[ActivityItem] = []

        for r in reversed(resumes[-3:]):
            activities.append(
                ActivityItem(
                    id=str(r.id),
                    type="resume",
                    title=f"Uploaded Resume: {r.display_name or r.filename}",
                    timestamp=r.created_at.strftime("%d %b %Y, %H:%M"),
                    detail=f"ATS Score: {r.ats_score}/100" if r.ats_score else None,
                )
            )

        for m in reversed(matches[-3:]):
            activities.append(
                ActivityItem(
                    id=str(m.id),
                    type="job_match",
                    title="Completed Company Job Match Analysis",
                    timestamp=m.created_at.strftime("%d %b %Y, %H:%M"),
                    detail=f"Match Score: {m.match_score}%",
                )
            )

        for i in reversed(interviews[-3:]):
            activities.append(
                ActivityItem(
                    id=str(i.id),
                    type="interview",
                    title=f"Completed Mock Interview for {i.role}",
                    timestamp=i.created_at.strftime("%d %b %Y, %H:%M"),
                    detail=f"Score: {i.overall_score}/100",
                )
            )

        if active_roadmap:
            activities.append(
                ActivityItem(
                    id=str(active_roadmap.id),
                    type="roadmap",
                    title=f"Active Learning Roadmap: {active_roadmap.target_role}",
                    timestamp=active_roadmap.created_at.strftime("%d %b %Y, %H:%M"),
                    detail=f"Progress: {active_roadmap.progress_percentage}%",
                )
            )

        activities.sort(key=lambda a: a.timestamp, reverse=True)

        # ── 8. Deterministic Recommendations ───────────────────────────────
        recs: list[RecommendationItem] = []

        if res_val < 75:
            recs.append(
                RecommendationItem(
                    category="Resume ATS",
                    action="Optimize Resume Keywords & Impact Quantifications",
                    impact="+15% ATS Score boost",
                )
            )
        if job_val < 70:
            recs.append(
                RecommendationItem(
                    category="Job Matching",
                    action="Analyze Job Descriptions and align missing skills in projects",
                    impact="+20% Company Match alignment",
                )
            )
        if int_val < 70 or total_interviews < 2:
            recs.append(
                RecommendationItem(
                    category="Mock Interview",
                    action="Take 2+ AI Mock Technical Interviews focusing on DSA & System Design",
                    impact="+25% Technical Interview Confidence",
                )
            )
        if rdm_val < 50:
            recs.append(
                RecommendationItem(
                    category="Learning Roadmap",
                    action="Complete Week 2 & Week 3 learning objectives",
                    impact="+20% Mastery Progress",
                )
            )

        if skills_to_improve:
            top_gap = skills_to_improve[0].skill
            recs.append(
                RecommendationItem(
                    category="Skill Gap",
                    action=f"Master '{top_gap}' and build a practice portfolio project",
                    impact="Fills top recruiter keyword gap",
                )
            )

        return AnalyticsSummaryResponse(
            overall_readiness_score=min(100, max(0, overall_readiness)),
            readiness_category=category,
            motivational_summary=motivation,
            current_ats=current_ats,
            highest_ats=highest_ats,
            average_ats=average_ats,
            ats_trend=ats_trend,
            latest_job_match=latest_job_match,
            highest_job_match=highest_job_match,
            average_job_match=average_job_match,
            job_match_trend=job_match_trend,
            average_interview_score=average_interview_score,
            best_interview_score=best_interview_score,
            total_interviews=total_interviews,
            interview_trend=interview_trend,
            competency_breakdown=competency,
            learning_progress_percentage=learning_progress,
            completed_weeks=completed_weeks,
            remaining_weeks=remaining_weeks,
            mastered_skills=mastered_skills,
            skills_to_improve=skills_to_improve,
            total_resumes_uploaded=total_resumes,
            total_job_matches=total_job_matches,
            total_interviews_taken=total_interviews,
            total_roadmaps_generated=total_roadmaps,
            recent_activities=activities[:6],
            recommendations=recs,
        )
