"""
Resume Analyzer service:
  1. Extract text from uploaded PDF using pdfplumber
  2. Send extracted text to OpenRouter via AIService
  3. Parse structured JSON response
  4. Store results in PostgreSQL
"""
import io
import json
import uuid
import logging
from pathlib import Path

import pdfplumber
from fastapi import HTTPException, UploadFile
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models.resume import ResumeAnalysis
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ── PDF Extraction ────────────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract all text from a PDF using pdfplumber."""
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages_text.append(text.strip())
            return "\n\n".join(pages_text)
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        return ""


# ── OpenRouter AI Analysis ───────────────────────────────────────────────────

from services.ai_service import get_ai_service

async def analyze_with_ai(resume_text: str) -> tuple[dict, str]:
    """
    Delegate resume analysis to AIService (OpenRouter API).
    Never silently falls back to mock data if key is missing or fails;
    returns clear HTTP error status codes.
    """
    key = settings.OPENROUTER_API_KEY.strip() if settings.OPENROUTER_API_KEY else ""
    if not key or key in ("your-openrouter-api-key-here", ""):
        raise HTTPException(
            status_code=400,
            detail="OPENROUTER_API_KEY is not configured in backend/.env file. Get a key from https://openrouter.ai/keys",
        )

    try:
        ai_service = get_ai_service()
        return await ai_service.analyze_resume(resume_text)

    except ValueError as ve:
        logger.warning("OpenRouter configuration issue: %s", ve)
        raise HTTPException(status_code=400, detail=str(ve)) from ve

    except RuntimeError as re_err:
        msg = str(re_err)
        logger.error("OpenRouter error surfaced to client: %s", msg)

        msg_lower = msg.lower()
        if "credits" in msg_lower or "insufficient" in msg_lower or "402" in msg:
            raise HTTPException(
                status_code=402,
                detail="OpenRouter account has insufficient credits. Top up at https://openrouter.ai/settings/credits",
            ) from re_err
        if "rate limit" in msg_lower or "quota" in msg_lower:
            raise HTTPException(status_code=429, detail=msg) from re_err
        if "invalid" in msg_lower or "key" in msg_lower or "unauthorized" in msg_lower:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid OpenRouter API Key: {msg}. Please check OPENROUTER_API_KEY in backend/.env",
            ) from re_err

        if "timed out" in msg_lower:
            raise HTTPException(status_code=504, detail=msg) from re_err
        if "not found" in msg_lower:
            raise HTTPException(status_code=404, detail=msg) from re_err

        raise HTTPException(status_code=503, detail=msg) from re_err

    except Exception as e:
        logger.error("Unexpected OpenRouter AI error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail=f"Unexpected OpenRouter service error: {str(e)}",
        ) from e


# ── Database Operations ───────────────────────────────────────────────────────

class ResumeService:

    @staticmethod
    async def upload_and_analyze(
        db: AsyncSession,
        user_id: uuid.UUID,
        file: UploadFile,
    ) -> ResumeAnalysis:
        """Full pipeline: validate → extract → analyze via OpenRouter → store → return."""
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are supported.")

        file_bytes = await file.read()
        file_size = len(file_bytes)

        if file_size > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 5 MB.")
        if file_size == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        extracted_text = extract_text_from_pdf(file_bytes)
        if not extracted_text.strip():
            raise HTTPException(
                status_code=422,
                detail="Could not extract text from this PDF. It may be scanned or image-based.",
            )

        analysis_data, raw_response = await analyze_with_ai(extracted_text)

        analysis = ResumeAnalysis(
            user_id=user_id,
            filename=file.filename,
            file_size=file_size,
            extracted_text=extracted_text[:50000],
            ats_score=analysis_data["ats_score"],
            skills_detected=analysis_data["skills_detected"],
            missing_keywords=analysis_data["missing_keywords"],
            strengths=analysis_data["strengths"],
            weaknesses=analysis_data["weaknesses"],
            suggestions=analysis_data["suggestions"],
            raw_gemini_response=raw_response[:10000],
        )
        db.add(analysis)
        await db.flush()
        await db.refresh(analysis)
        return analysis

    @staticmethod
    async def get_user_analyses(
        db: AsyncSession, user_id: uuid.UUID, limit: int = 20
    ) -> list[ResumeAnalysis]:
        """Get all resume analyses for a user, newest first."""
        result = await db.execute(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_analysis_by_id(
        db: AsyncSession, analysis_id: uuid.UUID, user_id: uuid.UUID
    ) -> ResumeAnalysis:
        """Get a specific analysis owned by the user."""
        result = await db.execute(
            select(ResumeAnalysis).where(
                ResumeAnalysis.id == analysis_id,
                ResumeAnalysis.user_id == user_id,
            )
        )
        analysis = result.scalar_one_or_none()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found.")
        return analysis

    @staticmethod
    async def get_latest(
        db: AsyncSession, user_id: uuid.UUID
    ) -> ResumeAnalysis | None:
        """Get the most recent analysis for a user."""
        result = await db.execute(
            select(ResumeAnalysis)
            .where(ResumeAnalysis.user_id == user_id)
            .order_by(desc(ResumeAnalysis.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_analysis(
        db: AsyncSession, analysis_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """Delete a resume analysis owned by the user."""
        analysis = await ResumeService.get_analysis_by_id(db, analysis_id, user_id)
        await db.delete(analysis)
        await db.commit()
        return True
