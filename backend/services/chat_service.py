"""
AI Career Copilot service:
- Aggregates context across Active Resume, Job Match, Learning Roadmap, and Interview History
- Manages conversation history in database
- Invokes AIService (OpenRouter LLM)
"""
import uuid
import logging
from sqlalchemy import select, delete, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from models.chat import ChatMessage
from prompts.chat_prompts import COPILOT_SYSTEM_PROMPT, COPILOT_USER_PROMPT_TEMPLATE
from services.ai_service import get_ai_service
from services.resume_service import ResumeService
from services.roadmap_service import RoadmapService
from services.job_service import JobService
from services.interview_service import InterviewService

logger = logging.getLogger(__name__)


class ChatService:

    @staticmethod
    async def get_copilot_context(db: AsyncSession, user_id: uuid.UUID) -> dict:
        """
        Aggregate context from all active modules for the candidate:
        1. Active Resume
        2. Latest Job Match
        3. Active Learning Roadmap
        4. Interview History
        """
        # 1. Active Resume
        active_resume = await ResumeService.get_latest(db, user_id)
        resume_name = (active_resume.display_name or active_resume.filename) if active_resume else "None uploaded"
        ats_score = active_resume.ats_score if (active_resume and active_resume.ats_score) else "N/A"
        skills_detected = ", ".join(active_resume.skills_detected[:10]) if (active_resume and active_resume.skills_detected) else "None detected"
        missing_keywords = ", ".join(active_resume.missing_keywords[:10]) if (active_resume and active_resume.missing_keywords) else "None"

        # 2. Latest Job Match
        job_matches = await JobService.get_user_matches(db, user_id, limit=1)
        latest_match = job_matches[0] if job_matches else None
        target_company_role = f"Job Match #{latest_match.id.hex[:6]}" if latest_match else "No job matches analyzed yet"
        job_match_score = f"{latest_match.match_score}%" if (latest_match and latest_match.match_score) else "N/A"
        job_missing_skills = ", ".join(latest_match.missing_skills[:8]) if (latest_match and latest_match.missing_skills) else "None"

        # 3. Active Roadmap
        roadmaps = await RoadmapService.get_user_roadmaps(db, user_id, limit=1)
        active_roadmap = roadmaps[0] if roadmaps else None
        roadmap_role = active_roadmap.target_role if active_roadmap else "None generated yet"
        roadmap_progress = active_roadmap.progress_percentage if active_roadmap else 0
        roadmap_week_objectives = "Week 1: Foundational Skill Mastery"
        if active_roadmap and active_roadmap.weekly_plan:
            first_week = active_roadmap.weekly_plan[0] if len(active_roadmap.weekly_plan) > 0 else {}
            roadmap_week_objectives = f"Week {first_week.get('week', 1)} ({first_week.get('title', 'Setup')}): {', '.join(first_week.get('objectives', [])[:2])}"

        # 4. Interview History
        interviews = await InterviewService.get_user_sessions(db, user_id, limit=5)
        interviews_completed = len(interviews)
        avg_score_val = 0
        all_weaknesses = []
        if interviews_completed > 0:
            scores = [i.overall_score for i in interviews if i.overall_score is not None]
            avg_score_val = round(sum(scores) / len(scores)) if scores else 0
            for i in interviews:
                if i.weaknesses:
                    all_weaknesses.extend(i.weaknesses)
        interview_weaknesses = ", ".join(list(set(all_weaknesses))[:6]) if all_weaknesses else "None recorded"
        avg_interview_score = f"{avg_score_val}%" if interviews_completed > 0 else "No interviews taken yet"

        return {
            "resume_name": resume_name,
            "ats_score": str(ats_score),
            "skills_detected": skills_detected,
            "missing_keywords": missing_keywords,
            "target_company_role": target_company_role,
            "job_match_score": str(job_match_score),
            "job_missing_skills": job_missing_skills,
            "roadmap_role": roadmap_role,
            "roadmap_progress": roadmap_progress,
            "roadmap_week_objectives": roadmap_week_objectives,
            "interviews_completed": interviews_completed,
            "avg_interview_score": avg_interview_score,
            "interview_weaknesses": interview_weaknesses,
        }

    @staticmethod
    async def send_message(
        db: AsyncSession,
        user_id: uuid.UUID,
        message_text: str,
        category: str | None = "general",
    ) -> ChatMessage:
        """
        Full pipeline:
        1. Save candidate message to DB
        2. Fetch recent conversation history & candidate context
        3. Build prompt & invoke OpenRouter AI
        4. Save AI assistant message to DB
        5. Return assistant ChatMessage
        """
        # Save candidate user message
        user_msg = ChatMessage(
            user_id=user_id,
            sender="user",
            message=message_text.strip(),
            category=category or "general",
        )
        db.add(user_msg)
        await db.commit()

        # Fetch recent chat thread (last 8 messages)
        recent_msgs_q = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(desc(ChatMessage.created_at))
            .limit(8)
        )
        recent_msgs = list(reversed(recent_msgs_q.scalars().all()))

        chat_history_formatted = "\n".join(
            [f"{m.sender.upper()}: {m.message}" for m in recent_msgs if m.id != user_msg.id]
        )
        if not chat_history_formatted:
            chat_history_formatted = "(New conversation started)"

        # Collect full candidate context
        ctx = await ChatService.get_copilot_context(db, user_id)

        user_prompt = COPILOT_USER_PROMPT_TEMPLATE.format(
            resume_name=ctx["resume_name"],
            ats_score=ctx["ats_score"],
            skills_detected=ctx["skills_detected"],
            missing_keywords=ctx["missing_keywords"],
            target_company_role=ctx["target_company_role"],
            job_match_score=ctx["job_match_score"],
            job_missing_skills=ctx["job_missing_skills"],
            roadmap_role=ctx["roadmap_role"],
            roadmap_progress=ctx["roadmap_progress"],
            roadmap_week_objectives=ctx["roadmap_week_objectives"],
            interviews_completed=ctx["interviews_completed"],
            avg_interview_score=ctx["avg_interview_score"],
            interview_weaknesses=ctx["interview_weaknesses"],
            chat_history=chat_history_formatted,
            user_message=message_text.strip(),
        )

        # Generate response via AIService
        ai_service = get_ai_service()
        assistant_reply = await ai_service.generate_copilot_chat_response(
            system_prompt=COPILOT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
        )

        # Save assistant reply to DB
        assistant_msg = ChatMessage(
            user_id=user_id,
            sender="assistant",
            message=assistant_reply,
            category=category or "general",
        )
        db.add(assistant_msg)
        await db.commit()
        await db.refresh(assistant_msg)
        return assistant_msg

    @staticmethod
    async def get_chat_history(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 100
    ) -> list[ChatMessage]:
        """Get all chat messages for a user, ordered chronologically."""
        result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(asc(ChatMessage.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def clear_chat_history(db: AsyncSession, user_id: uuid.UUID) -> bool:
        """Delete all chat messages for a user."""
        await db.execute(
            delete(ChatMessage).where(ChatMessage.user_id == user_id)
        )
        await db.commit()
        return True
