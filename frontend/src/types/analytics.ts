export interface ScoreTrendPoint {
  date: string
  score: number
  label: string
}

export interface CompetencyBreakdown {
  hr: number
  technical: number
  dsa: number
  communication: number
  problem_solving: number
}

export interface SkillMasteredItem {
  skill: string
  frequency: number
  confidence: string
}

export interface SkillToImproveItem {
  skill: string
  frequency: number
  priority: string
}

export interface ActivityItem {
  id: string
  type: string
  title: string
  timestamp: string
  detail?: string | null
}

export interface RecommendationItem {
  category: string
  action: string
  impact: string
}

export interface AnalyticsSummary {
  overall_readiness_score: number
  readiness_category: string
  motivational_summary: string
  current_ats: number | null
  highest_ats: number | null
  average_ats: number | null
  ats_trend: ScoreTrendPoint[]
  latest_job_match: number | null
  highest_job_match: number | null
  average_job_match: number | null
  job_match_trend: ScoreTrendPoint[]
  average_interview_score: number | null
  best_interview_score: number | null
  total_interviews: number
  interview_trend: ScoreTrendPoint[]
  competency_breakdown: CompetencyBreakdown
  learning_progress_percentage: number
  completed_weeks: number
  remaining_weeks: number
  mastered_skills: SkillMasteredItem[]
  skills_to_improve: SkillToImproveItem[]
  total_resumes_uploaded: number
  total_job_matches: number
  total_interviews_taken: number
  total_roadmaps_generated: number
  recent_activities: ActivityItem[]
  recommendations: RecommendationItem[]
}
