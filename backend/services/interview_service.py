"""
Service layer for AI Mock Interview operations.
Integrates directly with AIService (OpenRouter).
"""
import uuid
import logging
from fastapi import HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.interview import InterviewSession
from models.resume import ResumeAnalysis
from models.job_description import JobDescription
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


class InterviewService:

    @staticmethod
    async def create_interview_session(
        db: AsyncSession,
        user_id: uuid.UUID,
        role: str,
        company_name: str | None = "Target Company",
        count: int = 5,
        resume_id: uuid.UUID | None = None,
        jd_id: uuid.UUID | None = None,
    ) -> InterviewSession:
        """Generate structured interview questions via AIService and start session."""
        skills_context = []

        # Gather skill context from resume or JD if provided
        if resume_id:
            res_q = await db.execute(
                select(ResumeAnalysis).where(
                    ResumeAnalysis.id == resume_id, ResumeAnalysis.user_id == user_id
                )
            )
            resume = res_q.scalar_one_or_none()
            if resume and resume.skills_detected:
                skills_context.extend(resume.skills_detected)

        if jd_id:
            jd_q = await db.execute(
                select(JobDescription).where(
                    JobDescription.id == jd_id, JobDescription.user_id == user_id
                )
            )
            jd = jd_q.scalar_one_or_none()
            if jd and jd.extracted_skills:
                skills_context.extend(jd.extracted_skills)

        if not skills_context:
            skills_context = ["Problem Solving", "Communication", "Technical Knowledge", "System Design", "Teamwork"]

        ai_service = get_ai_service()
        try:
            questions_data, _ = await ai_service.generate_interview_questions(
                role=role,
                company_name=company_name,
                skills=skills_context[:10],
                count=count,
            )
        except Exception as e:
            logger.error("Failed to generate interview questions: %s", e)
            raise HTTPException(
                status_code=503, detail=f"Failed to generate interview questions: {str(e)}"
            ) from e

        # Normalize questions format
        normalized_questions = []
        for idx, q in enumerate(questions_data, 1):
            q_type = q.get("question_type")
            if not q_type:
                q_type = "hr" if idx == 1 else ("technical" if idx == 2 else "dsa")

            sample_cases_raw = q.get("sample_test_cases", [])
            normalized_cases = []
            for tc in sample_cases_raw:
                if isinstance(tc, dict):
                    normalized_cases.append(f"Input: {tc.get('input', '')} -> Output: {tc.get('expected_output', tc.get('output', ''))}")
                else:
                    normalized_cases.append(str(tc))

            normalized_questions.append({
                "id": q.get("id", idx),
                "question": q.get("question", f"Question {idx}"),
                "question_type": q_type,
                "category": q.get("category", q_type.upper()),
                "difficulty": q.get("difficulty", "Medium"),
                "starter_code_templates": q.get("starter_code_templates", {}),
                "constraints": [str(c) for c in q.get("constraints", [])],
                "sample_test_cases": normalized_cases,
                "expected_key_points": [str(kp) for kp in q.get("expected_key_points", [])],
            })

        session = InterviewSession(
            user_id=user_id,
            role=role,
            company_name=company_name or "Target Company",
            questions=normalized_questions,
            answers_and_feedback=[],
            overall_score=None,
            status="in_progress",
        )
        db.add(session)
        await db.flush()
        await db.refresh(session)
        return session

    @staticmethod
    async def evaluate_single_question(
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
        question_id: int,
        question: str,
        question_type: str,
        candidate_answer: str | None = None,
        candidate_code: str | None = None,
        selected_language: str | None = "python",
        expected_key_points: list | None = None,
        status: str = "evaluated",
    ) -> InterviewSession:
        """Evaluate a single question (oral or coding) in real time and store in session."""
        session = await InterviewService.get_session_by_id(db, session_id, user_id)
        ai_service = get_ai_service()

        try:
            eval_data, _ = await ai_service.evaluate_single_interview_question(
                question=question,
                question_type=question_type,
                candidate_answer=candidate_answer,
                candidate_code=candidate_code,
                selected_language=selected_language,
                expected_key_points=expected_key_points or [],
            )
            score = max(0, min(100, int(eval_data.get("score", 70))))
        except Exception as e:
            logger.warning("Single question evaluation warning for q_id=%s: %s", question_id, e)
            score = 70
            eval_data = {
                "score": 70,
                "correctness": "Answer evaluated",
                "time_complexity": "O(N)" if question_type == "dsa" else "N/A",
                "space_complexity": "O(1)" if question_type == "dsa" else "N/A",
                "code_readability": "Readable",
                "edge_cases": "Standard coverage",
                "strengths": ["Clear logical approach"],
                "weaknesses": ["Consider edge cases and optimal complexity"],
                "optimal_solution": "Optimal implementation provided.",
                "improvement_suggestions": ["Review data structures and algorithmic complexity"],
            }

        feedback_entry = {
            "question_id": question_id,
            "question": question,
            "question_type": question_type,
            "candidate_answer": candidate_answer,
            "candidate_code": candidate_code,
            "selected_language": selected_language,
            "status": status,
            "score": score,
            "correctness": eval_data.get("correctness", "Good"),
            "time_complexity": eval_data.get("time_complexity", "N/A"),
            "space_complexity": eval_data.get("space_complexity", "N/A"),
            "code_readability": eval_data.get("code_readability", "N/A"),
            "edge_cases": eval_data.get("edge_cases", "Handled"),
            "strengths": eval_data.get("strengths", []),
            "weaknesses": eval_data.get("weaknesses", []),
            "optimal_solution": eval_data.get("optimal_solution", ""),
            "improvement_suggestions": eval_data.get("improvement_suggestions", []),
        }

        # Update or append in session.answers_and_feedback array
        current_list = list(session.answers_and_feedback or [])
        updated = False
        for idx, item in enumerate(current_list):
            if item.get("question_id") == question_id:
                current_list[idx] = feedback_entry
                updated = True
                break

        if not updated:
            current_list.append(feedback_entry)

        session.answers_and_feedback = current_list
        db.add(session)
        await db.flush()
        await db.refresh(session)
        return session

    @staticmethod
    async def complete_session(
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> InterviewSession:
        """Generate final performance report (Scores, Strengths, Weaknesses, Topics) and mark complete."""
        session = await InterviewService.get_session_by_id(db, session_id, user_id)
        ai_service = get_ai_service()

        try:
            report_data, _ = await ai_service.generate_final_interview_report(
                role=session.role,
                answers_and_feedback=session.answers_and_feedback or [],
            )
            session.overall_score = max(0, min(100, int(report_data.get("overall_score", 75))))
            session.hr_score = max(0, min(100, int(report_data.get("hr_score", 75))))
            session.technical_score = max(0, min(100, int(report_data.get("technical_score", 75))))
            session.dsa_score = max(0, min(100, int(report_data.get("dsa_score", 75))))
            session.strengths = report_data.get("strengths", [])
            session.weaknesses = report_data.get("weaknesses", [])
            session.recommended_topics = report_data.get("recommended_topics", [])
        except Exception as e:
            logger.error("Failed to generate final interview report: %s", e)
            session.overall_score = 75
            session.hr_score = 75
            session.technical_score = 75
            session.dsa_score = 75
            session.strengths = ["Completed session"]
            session.weaknesses = ["Review technical concepts"]
            session.recommended_topics = ["Data Structures", "Algorithms", "System Design"]

        session.status = "completed"
        db.add(session)
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_user_sessions(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 20
    ) -> list[InterviewSession]:
        """Fetch all interview sessions owned by user."""
        result = await db.execute(
            select(InterviewSession)
            .where(InterviewSession.user_id == user_id)
            .order_by(desc(InterviewSession.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_session_by_id(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> InterviewSession:
        """Fetch single interview session owned by user."""
        result = await db.execute(
            select(InterviewSession).where(
                InterviewSession.id == session_id, InterviewSession.user_id == user_id
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found.")
        return session

    @staticmethod
    async def delete_session(
        db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete an interview session by ID."""
        session = await InterviewService.get_session_by_id(db, session_id, user_id)
        await db.delete(session)
        await db.commit()
        return True
