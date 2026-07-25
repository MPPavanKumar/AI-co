"""
AI Prompts for Career Copilot assistant via OpenRouter LLM.
Injects rich candidate context: Active Resume, Latest Job Match, Learning Roadmap, and Interview History.
"""

COPILOT_SYSTEM_PROMPT = (
    "You are CareerPilot Copilot, an elite AI Career Advisor, Senior Engineering Director, "
    "and Executive Career Coach. Your goal is to guide the candidate to top-tier placements, "
    "FAANG/Tier-1 software engineering roles, and accelerated career growth.\n\n"
    "Guidelines:\n"
    "1. Refer directly to the candidate's Active Resume, Target Role, Skill Gaps, and Interview History when relevant.\n"
    "2. Provide highly specific, actionable, and structured guidance using Markdown (bullet points, bold text, code blocks, tables).\n"
    "3. Never fabricate or invent candidate credentials or fake experience.\n"
    "4. If requested context is missing (e.g. no active resume uploaded), politely inform the candidate and suggest uploading one.\n"
    "5. Keep responses encouraging, highly professional, analytical, and structured."
)

COPILOT_USER_PROMPT_TEMPLATE = """CANDIDATE CAREER PROFILE & CONTEXT:
==================================================
1. ACTIVE RESUME:
   - Name: {resume_name}
   - ATS Score: {ats_score} / 100
   - Top Detected Skills: {skills_detected}
   - Missing Keywords / Gaps: {missing_keywords}

2. LATEST JOB MATCH:
   - Target Company / Role: {target_company_role}
   - Match Score: {job_match_score}
   - Key Missing Skills for Role: {job_missing_skills}

3. LEARNING ROADMAP:
   - Target Role: {roadmap_role}
   - Progress: {roadmap_progress}%
   - Current Week & Objectives: {roadmap_week_objectives}

4. MOCK INTERVIEW HISTORY:
   - Interviews Completed: {interviews_completed}
   - Average Score: {avg_interview_score} / 100
   - Areas for Improvement: {interview_weaknesses}

==================================================
PREVIOUS CONVERSATION THREAD (Recent Messages):
{chat_history}

==================================================
CANDIDATE QUESTION / REQUEST:
{user_message}
"""
