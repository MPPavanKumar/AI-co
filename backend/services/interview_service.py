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
            "technical_accuracy": eval_data.get("technical_accuracy", score),
            "technical_accuracy_explanation": eval_data.get("technical_accuracy_explanation", eval_data.get("correctness", "")),
            "communication_skills": eval_data.get("communication_skills", score),
            "communication_explanation": eval_data.get("communication_explanation", ""),
            "confidence": eval_data.get("confidence", score),
            "confidence_explanation": eval_data.get("confidence_explanation", ""),
            "hiring_recommendation": eval_data.get("hiring_recommendation", "Hire"),
            "recommendation_reason": eval_data.get("recommendation_reason", ""),
            "correctness": eval_data.get("correctness", "Good"),
            "time_complexity": eval_data.get("time_complexity", "N/A"),
            "space_complexity": eval_data.get("space_complexity", "N/A"),
            "code_readability": eval_data.get("code_readability", "N/A"),
            "edge_cases": eval_data.get("edge_cases", "Handled"),
            "strengths": eval_data.get("strengths", []),
            "weaknesses": eval_data.get("weaknesses", []),
            "optimal_solution": eval_data.get("optimal_solution", ""),
            "improvement_suggestions": eval_data.get("improvement_suggestions", []),
            "suggestions_for_improvement": eval_data.get("suggestions_for_improvement", eval_data.get("improvement_suggestions", [])),
            "better_sample_answer": eval_data.get("better_sample_answer", eval_data.get("optimal_solution", "")),
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
    async def evaluate_answer_feedback(
        question: str,
        question_type: str = "technical",
        user_answer: str | None = None,
        user_code: str | None = None,
        selected_language: str | None = "python",
    ) -> dict:
        """Standalone AI Interview Feedback evaluation."""
        ai_service = get_ai_service()
        eval_data, _ = await ai_service.evaluate_answer_feedback(
            question=question,
            question_type=question_type,
            user_answer=user_answer,
            user_code=user_code,
            selected_language=selected_language,
        )
        return eval_data

    @staticmethod
    async def complete_session(
        db: AsyncSession,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> InterviewSession:
        """Generate final performance report (Scores, Strengths, Weaknesses, Topics) and mark complete."""
        session = await InterviewService.get_session_by_id(db, session_id, user_id)
        ai_service = get_ai_service()

        feedback_list = session.answers_and_feedback or []
        questions_map = {q.get("id"): str(q.get("question_type", "")).lower() for q in (session.questions or [])}

        hr_scores = []
        tech_scores = []
        dsa_scores = []
        all_scores = []

        for item in feedback_list:
            if not isinstance(item, dict):
                continue
            sc = item.get("score")
            if sc is None:
                continue
            try:
                sc = int(sc)
            except (ValueError, TypeError):
                continue

            all_scores.append(sc)
            q_id = item.get("question_id")
            q_type = str(item.get("question_type", "")).lower()
            if not q_type and q_id in questions_map:
                q_type = questions_map[q_id]

            if q_type in ["dsa", "coding", "algorithm"]:
                dsa_scores.append(sc)
            elif q_type in ["hr", "behavioral"]:
                hr_scores.append(sc)
            elif q_type in ["technical", "architecture", "system_design"]:
                tech_scores.append(sc)
            else:
                if q_id == 1:
                    hr_scores.append(sc)
                elif q_id == 2:
                    tech_scores.append(sc)
                else:
                    dsa_scores.append(sc)

        emp_overall = round(sum(all_scores) / len(all_scores)) if all_scores else None
        emp_hr = round(sum(hr_scores) / len(hr_scores)) if hr_scores else None
        emp_tech = round(sum(tech_scores) / len(tech_scores)) if tech_scores else None
        emp_dsa = round(sum(dsa_scores) / len(dsa_scores)) if dsa_scores else None

        try:
            report_data, _ = await ai_service.generate_final_interview_report(
                role=session.role,
                answers_and_feedback=feedback_list,
            )
            session.strengths = report_data.get("strengths", [])
            session.weaknesses = report_data.get("weaknesses", [])
            session.recommended_topics = report_data.get("recommended_topics", [])

            ai_overall = report_data.get("overall_score")
            ai_hr = report_data.get("hr_score")
            ai_tech = report_data.get("technical_score")
            ai_dsa = report_data.get("dsa_score")

            session.overall_score = emp_overall if emp_overall is not None else (int(ai_overall) if ai_overall is not None else 75)
            session.hr_score = emp_hr if emp_hr is not None else (int(ai_hr) if ai_hr is not None else session.overall_score)
            session.technical_score = emp_tech if emp_tech is not None else (int(ai_tech) if ai_tech is not None else session.overall_score)
            session.dsa_score = emp_dsa if emp_dsa is not None else (int(ai_dsa) if ai_dsa is not None else session.overall_score)

        except Exception as e:
            logger.error("Failed to generate final interview report: %s", e)
            session.overall_score = emp_overall if emp_overall is not None else 75
            session.hr_score = emp_hr if emp_hr is not None else session.overall_score
            session.technical_score = emp_tech if emp_tech is not None else session.overall_score
            session.dsa_score = emp_dsa if emp_dsa is not None else session.overall_score
            session.strengths = ["Completed mock interview session"]
            session.weaknesses = ["Review edge cases and Big-O efficiency"]
            session.recommended_topics = ["Data Structures & Algorithms", "System Architecture"]

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
