"""
OpenRouter AI Service Layer — Powered by AsyncOpenAI.
Provides reusable AI capabilities across the platform:
- Resume Analysis & ATS Scoring
- Resume Improvement Suggestions
- Resume Summary & Cover Letter Generation
- Company Match Analysis
- Interview Question Generation & Feedback
- Skill & Keyword Extraction
- Learning Roadmap Generation

Model configured via OPENROUTER_MODEL in .env (default: openrouter/auto).
"""
import asyncio
import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Tuple

from openai import AsyncOpenAI, APIError, APIConnectionError, RateLimitError, AuthenticationError

from core.config import settings

logger = logging.getLogger(__name__)


class AIService:
    """
    Unified OpenRouter AI Service using AsyncOpenAI client.
    Initializes client once, handles async completions, retries,
    timing logs, structured JSON parsing, and detailed error mapping.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        self.api_key = (api_key or settings.OPENROUTER_API_KEY).strip().strip('"').strip("'")
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).strip()
        self.model = (model or settings.OPENROUTER_MODEL).strip()

        if not self.api_key or self.api_key in ("your-openrouter-api-key-here", ""):
            raise ValueError(
                "OPENROUTER_API_KEY is not configured in .env file. "
                "Get a key from https://openrouter.ai/keys"
            )

        if not self.api_key.startswith("sk-or-v1-"):
            logger.warning(
                "[AIService] API key does not start with standard OpenRouter prefix 'sk-or-v1-'. "
                "Key prefix detected: %s...", self.api_key[:8]
            )

        # Initialize the official AsyncOpenAI client pointing to OpenRouter
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
            default_headers={
                "HTTP-Referer": "https://careerpilot.ai",
                "X-Title": "CareerPilot AI",
            },
        )
        logger.info(
            "[AIService] Initialized | model=%s | base_url=%s | key_prefix=%s...",
            self.model,
            self.base_url,
            self.api_key[:8] if self.api_key else "(empty)",
        )

    async def verify_connection(self) -> bool:
        """
        Lightweight health check call to verify OpenRouter API key and model responsiveness.
        Sends: 'Reply with exactly: OK'
        Used during application startup.
        """
        start_time = time.time()
        try:
            response = await self.generate_completion(
                prompt="Reply with exactly: OK",
                temperature=0.1,
                max_tokens=10,
                retries=1,
            )
            duration = time.time() - start_time
            logger.info(
                "[AIService] Connection test successful | duration=%.2fs | response='%s'",
                duration,
                response,
            )
            return True
        except Exception as e:
            duration = time.time() - start_time
            logger.error("[AIService] Connection test failed after %.2fs: %s", duration, e)
            raise

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: Optional[int] = None,
        response_format_json: bool = False,
        retries: int = 2,
    ) -> str:
        """
        Core async generation using OpenRouter API via AsyncOpenAI.
        Includes retries, request timing logs, and status-based exception mapping.
        """
        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        if response_format_json:
            kwargs["response_format"] = {"type": "json_object"}

        attempt = 0
        start_time = time.time()

        while attempt <= retries:
            attempt += 1
            try:
                logger.info(
                    "[AIService] POST chat/completions | model=%s | attempt=%d",
                    self.model,
                    attempt,
                )

                response = await self.client.chat.completions.create(**kwargs)
                duration = time.time() - start_time
                content = response.choices[0].message.content or ""

                logger.info(
                    "[AIService] OK | model=%s | duration=%.2fs | bytes=%d",
                    self.model,
                    duration,
                    len(content),
                )
                return content.strip()

            except AuthenticationError as e:
                duration = time.time() - start_time
                logger.error("[AIService] AuthenticationError | msg=%s | duration=%.2fs", e, duration)
                raise RuntimeError("Invalid or unauthorized OPENROUTER_API_KEY. Please check your key at https://openrouter.ai/keys") from e

            except RateLimitError as e:
                duration = time.time() - start_time
                msg = str(e)
                logger.error("[AIService] RateLimitError/Payment | msg=%s | duration=%.2fs", msg, duration)
                if "credits" in msg.lower() or "payment" in msg.lower() or "402" in msg:
                    raise RuntimeError("OpenRouter account has insufficient credits. Top up at https://openrouter.ai/settings/credits") from e
                if attempt <= retries:
                    wait_time = attempt * 2
                    await asyncio.sleep(wait_time)
                    continue
                raise RuntimeError("OpenRouter rate limit exceeded. Please try again later.") from e

            except APIError as e:
                duration = time.time() - start_time
                status_code = getattr(e, "status_code", None)
                msg = str(e)
                logger.error("[AIService] APIError | status=%s | msg=%s | duration=%.2fs", status_code, msg, duration)

                if status_code == 402 or "credits" in msg.lower():
                    raise RuntimeError("OpenRouter account has insufficient credits. Top up at https://openrouter.ai/settings/credits") from e

                if status_code in (429, 502, 503, 504) and attempt <= retries:
                    wait_time = attempt * 2
                    logger.warning("[AIService] Retrying in %ds...", wait_time)
                    await asyncio.sleep(wait_time)
                    continue

                raise RuntimeError(f"OpenRouter API Error ({status_code}): {msg}") from e

            except APIConnectionError as e:
                duration = time.time() - start_time
                logger.error("[AIService] APIConnectionError | duration=%.2fs", duration)
                if attempt <= retries:
                    await asyncio.sleep(1)
                    continue
                raise RuntimeError("Failed to connect to OpenRouter API. Please check your internet connection.") from e

            except Exception as e:
                duration = time.time() - start_time
                logger.error("[AIService] Unexpected error: %s | duration=%.2fs", e, duration)
                raise RuntimeError(f"OpenRouter service error: {str(e)}") from e

        raise RuntimeError("OpenRouter API request failed after retries.")

    async def generate_json(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """Generate and parse structured JSON response."""
        raw_text = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=temperature,
            response_format_json=True,
        )
        return self._clean_and_parse_json(raw_text)

    @staticmethod
    def _clean_and_parse_json(text: str) -> Dict[str, Any]:
        """Strip markdown code fences and parse JSON payload."""
        cleaned = text.strip()
        cleaned = re.sub(r"^```json\s*", "", cleaned)
        cleaned = re.sub(r"^```\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            return json.loads(cleaned.strip())
        except json.JSONDecodeError as e:
            logger.error("[AIService] JSON parse failed: %s | raw_output=%s", e, text[:500])
            raise ValueError("Failed to parse valid JSON from AI response.") from e

    # ── Feature Implementation Methods ────────────────────────────────────────

    async def analyze_resume(self, resume_text: str) -> Tuple[Dict[str, Any], str]:
        """Feature: Resume Analysis, ATS Scoring, Improvement Suggestions & Skill Detection"""
        system_prompt = (
            "You are an expert ATS (Applicant Tracking System) reviewer and senior technical recruiter. "
            "Always respond strictly in valid JSON format."
        )
        prompt = f"""You are an expert ATS resume reviewer for software engineering roles.

Analyze the following resume text and return a JSON object with EXACTLY this structure:

{{
  "ats_score": <integer 0-100>,
  "skills_detected": [<list of technical and soft skills found>],
  "missing_keywords": [<list of important missing skills for software engineering roles>],
  "strengths": [<list of 3-5 specific strengths as clear sentences>],
  "weaknesses": [<list of 3-5 specific weaknesses as clear sentences>],
  "suggestions": [<list of 5-7 specific, actionable improvement tips>]
}}

ATS score criteria:
- 80-100: Excellent ATS optimization
- 60-79: Good, minor improvements needed
- 40-59: Average, significant improvements needed
- 0-39: Poor ATS optimization

Resume Text:
---
{resume_text[:8000]}
---

Respond with ONLY the JSON object, no explanation."""

        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)

        validated = {
            "ats_score": max(0, min(100, int(parsed.get("ats_score", 0)))),
            "skills_detected": parsed.get("skills_detected", []),
            "missing_keywords": parsed.get("missing_keywords", []),
            "strengths": parsed.get("strengths", []),
            "weaknesses": parsed.get("weaknesses", []),
            "suggestions": parsed.get("suggestions", []),
        }
        return validated, raw_response

    async def generate_resume_summary(self, resume_text: str) -> str:
        """Feature: Executive Resume Summary Generation"""
        prompt = f"""Generate a professional, compelling 3-4 sentence professional summary based on this resume:

Resume Text:
---
{resume_text[:6000]}
---
"""
        return await self.generate_completion(prompt=prompt, temperature=0.4)

    async def match_company_jd(self, resume_text: str, jd_text: str) -> Tuple[Dict[str, Any], str]:
        """Feature: Company Job Description Matching"""
        system_prompt = "You are an expert technical hiring manager evaluating job description fit. Always respond strictly in valid JSON format."
        prompt = f"""Compare the candidate's resume against the provided Job Description.

Return a JSON object with:
{{
  "match_score": <integer 0-100>,
  "matching_skills": [<skills found in both resume and JD>],
  "missing_skills": [<required JD skills missing from resume>],
  "fit_summary": "<2-3 sentence overview of candidate suitability>",
  "recommendations": [<actionable steps to bridge the gap>]
}}

Resume:
---
{resume_text[:6000]}
---

Job Description:
---
{jd_text[:4000]}
---
"""
        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)
        return parsed, raw_response

    async def generate_cover_letter(self, resume_text: str, jd_text: str, company_name: str = "Target Company") -> str:
        """Feature: Custom Cover Letter Generation"""
        prompt = f"""Write a professional, targeted cover letter for a position at {company_name} matching this candidate's resume to the job description.

Candidate Resume:
---
{resume_text[:5000]}
---

Job Description:
---
{jd_text[:4000]}
---

Return a polished, professional cover letter text ready to be sent."""
        return await self.generate_completion(prompt=prompt, temperature=0.5)

    async def generate_interview_questions(
        self, role: str, skills: List[str], count: int = 5
    ) -> Tuple[List[Dict[str, Any]], str]:
        """Feature: Interview Question Generation"""
        system_prompt = "You are a senior technical interviewer. Always respond strictly in valid JSON format."
        prompt = f"""Generate {count} technical and behavioral interview questions for a candidate applying for the role of '{role}'.
Target Skills: {', '.join(skills)}

Return a JSON object with a 'questions' array containing objects with:
- id: integer
- question: string
- category: "technical" | "behavioral" | "system_design"
- difficulty: "easy" | "medium" | "hard"
- expected_key_points: array of strings
"""
        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.5,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)
        return parsed.get("questions", []), raw_response

    async def evaluate_interview_feedback(
        self, question: str, candidate_answer: str, expected_key_points: Optional[List[str]] = None
    ) -> Tuple[Dict[str, Any], str]:
        """Feature: Interview Feedback & Evaluation"""
        system_prompt = "You are an AI interview evaluator. Always respond strictly in valid JSON format."
        prompt = f"""Evaluate the candidate's answer to the following interview question:

Question: {question}
Expected Key Points: {json.dumps(expected_key_points or [])}
Candidate Answer: {candidate_answer}

Return a JSON object with:
{{
  "score": <integer 0-100>,
  "strengths": [<what the candidate answered well>],
  "improvements": [<what was missing or needs refinement>],
  "sample_ideal_answer": "<a model answer for reference>"
}}
"""
        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)
        return parsed, raw_response

    async def extract_skills(self, text: str) -> Tuple[List[str], str]:
        """Feature: Skill and Keyword Extraction"""
        system_prompt = "You are a natural language skill extraction engine. Always respond strictly in valid JSON format."
        prompt = f"""Extract all technical tools, programming languages, frameworks, databases, and soft skills from this text.

Return a JSON object:
{{
  "skills": [<array of extracted skill strings>]
}}

Text:
---
{text[:6000]}
---
"""
        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)
        return parsed.get("skills", []), raw_response

    async def generate_learning_roadmap(
        self, missing_skills: List[str], target_role: str
    ) -> Tuple[Dict[str, Any], str]:
        """Feature: Learning Roadmap Generation"""
        system_prompt = "You are a career development mentor creating step-by-step learning roadmaps. Always respond strictly in valid JSON format."
        prompt = f"""Create a weekly learning roadmap for a candidate aiming for the role of '{target_role}' to master the following missing skills: {', '.join(missing_skills)}.

Return a JSON object:
{{
  "target_role": "{target_role}",
  "total_weeks": <integer>,
  "weekly_plan": [
    {{
      "week": 1,
      "topic": "<string>",
      "objectives": [<array of goals>],
      "recommended_resources": [<array of topic areas to practice/study>]
    }}
  ]
}}
"""
        raw_response = await self.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.4,
            response_format_json=True,
        )
        parsed = self._clean_and_parse_json(raw_response)
        return parsed, raw_response


# Global singleton instance for AIService
_ai_service_instance: Optional[AIService] = None


def get_ai_service() -> AIService:
    """
    Return the global AIService singleton.
    Initializes ONCE on first access.
    """
    global _ai_service_instance
    if _ai_service_instance is None:
        _ai_service_instance = AIService()
    return _ai_service_instance
