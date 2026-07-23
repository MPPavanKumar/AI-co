export interface ActivityItem {
  id: string
  type: 'resume' | 'job_match' | 'interview'
  title: string
  score: number | null
  timestamp: string
}

export interface DashboardSummary {
  total_resumes: number
  total_jds: number
  total_interviews: number
  avg_ats_score: number | null
  avg_match_score: number | null
  avg_interview_score: number | null
  recent_activity: ActivityItem[]
}
