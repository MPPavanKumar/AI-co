"""
Pydantic schemas for Advanced AI Mock Interview sessions, multi-language coding,
per-question evaluation, and multi-metric final performance report.
"""
from uuid import UUID
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class InterviewGenerateRequest(BaseModel):
    role: str = Field(..., min_length=2, max_length=255, description="Job role for interview")
    company_name: str | None = Field(default="Target Company", max_length=255)
    resume_id: UUID | None = Field(default=None, description="Optional resume ID for context")
    jd_id: UUID | None = Field(default=None, description="Optional JD ID for context")


class InterviewQuestion(BaseModel):
    id: int
    question: str
    question_type: str = Field(description="hr, technical, or dsa")
    category: str = Field(description="HR, Technical, Project, Behavioral, System Design, DSA")
    difficulty: str = Field(description="Easy, Medium, Hard")
    starter_code_templates: Dict[str, str] = Field(default_factory=dict)
    constraints: List[str] = Field(default_factory=list)
    sample_test_cases: List[str] = Field(default_factory=list)
    expected_key_points: List[str] = Field(default_factory=list)


class SingleQuestionEvaluateRequest(BaseModel):
    question_id: int
    question: str
    question_type: str = Field(default="technical")
    candidate_answer: Optional[str] = None
    candidate_code: Optional[str] = None
    selected_language: Optional[str] = Field(default="python")
    expected_key_points: List[str] = Field(default_factory=list)


class QuestionFeedback(BaseModel):
    question_id: int
    question: str
    question_type: str
    candidate_answer: Optional[str] = None
    candidate_code: Optional[str] = None
    selected_language: Optional[str] = None
    status: str = Field(default="evaluated")  # pending, answered, skipped, marked_for_review, evaluated
    score: int
    correctness: str = Field(default="Good")
    time_complexity: str = Field(default="N/A")
    space_complexity: str = Field(default="N/A")
    code_readability: str = Field(default="N/A")
    edge_cases: str = Field(default="Handled")
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    optimal_solution: str = Field(default="")
    improvement_suggestions: List[str] = Field(default_factory=list)


class FinalReportResponse(BaseModel):
    overall_score: int
    hr_score: int
    technical_score: int
    dsa_score: int
    strengths: List[str]
    weaknesses: List[str]
    recommended_topics: List[str]


class InterviewSessionResponse(BaseModel):
    id: UUID
    role: str
    company_name: Optional[str]
    questions: List[InterviewQuestion]
    answers_and_feedback: List[QuestionFeedback]
    overall_score: Optional[int]
    hr_score: Optional[int]
    technical_score: Optional[int]
    dsa_score: Optional[int]
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommended_topics: List[str] = Field(default_factory=list)
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
