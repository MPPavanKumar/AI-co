export interface ResumeAnalysis {
  id: string
  user_id: string
  filename: string
  display_name?: string | null
  is_active?: boolean
  file_size: number | null
  ats_score: number | null
  skills_detected: string[]
  missing_keywords: string[]
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  created_at: string
  updated_at?: string | null
}

export interface ResumeListItem {
  id: string
  filename: string
  display_name?: string | null
  is_active?: boolean
  file_size?: number | null
  ats_score: number | null
  created_at: string
  updated_at?: string | null
}

export interface AnalysisStatus {
  message: string
  analysis: ResumeAnalysis
}
