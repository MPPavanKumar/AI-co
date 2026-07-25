export type QuestionType = 'hr' | 'technical' | 'dsa'
export type QuestionStatus = 'pending' | 'answered' | 'skipped' | 'marked_for_review' | 'evaluated'
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp'

export interface InterviewQuestion {
  id: number
  question: string
  question_type: QuestionType
  category: string
  difficulty: string
  starter_code_templates: Record<string, string>
  constraints: string[]
  sample_test_cases: string[]
  expected_key_points: string[]
}

export interface SingleQuestionEvaluateRequest {
  question_id: number
  question: string
  question_type: QuestionType
  candidate_answer?: string
  candidate_code?: string
  selected_language?: ProgrammingLanguage
  expected_key_points?: string[]
}

export interface InterviewAnswerFeedbackRequest {
  question: string
  question_type?: QuestionType
  user_answer?: string
  user_code?: string
  selected_language?: ProgrammingLanguage
}

export interface InterviewAnswerFeedbackResponse {
  overall_score: number
  technical_accuracy: number
  technical_accuracy_explanation: string
  communication_skills: number
  communication_explanation: string
  confidence: number
  confidence_explanation: string
  hiring_recommendation: string
  recommendation_reason: string
  strengths: string[]
  weaknesses: string[]
  suggestions_for_improvement: string[]
  better_sample_answer: string
}

export interface QuestionFeedback {
  question_id: number
  question: string
  question_type: QuestionType
  candidate_answer?: string
  candidate_code?: string
  selected_language?: ProgrammingLanguage
  status: QuestionStatus
  score: number
  technical_accuracy?: number
  technical_accuracy_explanation?: string
  communication_skills?: number
  communication_explanation?: string
  confidence?: number
  confidence_explanation?: string
  hiring_recommendation?: string
  recommendation_reason?: string
  correctness: string
  time_complexity: string
  space_complexity: string
  code_readability: string
  edge_cases: string
  strengths: string[]
  weaknesses: string[]
  optimal_solution: string
  improvement_suggestions: string[]
  suggestions_for_improvement?: string[]
  better_sample_answer?: string
}

export interface InterviewSession {
  id: string
  role: string
  company_name: string | null
  questions: InterviewQuestion[]
  answers_and_feedback: QuestionFeedback[]
  overall_score: number | null
  hr_score: number | null
  technical_score: number | null
  dsa_score: number | null
  strengths: string[]
  weaknesses: string[]
  recommended_topics: string[]
  status: string
  created_at: string
}

export interface InterviewGenerateRequest {
  role: string
  company_name?: string
  resume_id?: string
  jd_id?: string
}
