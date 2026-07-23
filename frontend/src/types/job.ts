export interface JobDescription {
  id: string
  title: string
  company_name: string | null
  raw_text: string
  extracted_skills: string[]
  required_experience: string | null
  keywords: string[]
  created_at: string
}

export interface JDParseRequest {
  title: string
  company_name?: string
  raw_text: string
}

export interface MatchAnalyzeRequest {
  resume_id?: string
  jd_id?: string
  raw_jd_text?: string
}

export interface JobMatch {
  id: string
  resume_id: string
  jd_id: string | null
  match_score: number
  matching_skills: string[]
  missing_skills: string[]
  fit_summary: string | null
  recommendations: string[]
  created_at: string
}
