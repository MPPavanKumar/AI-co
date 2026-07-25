export interface ActivityItem {
  id: string
  type: 'resume' | 'job_match' | 'interview' | 'roadmap'
  title: string
  score: number | null
  timestamp: string
}

export interface ActiveResumeInfo {
  id: string
  filename: string
  ats_score: number | null
  created_at: string
}

export interface ActiveRoadmapInfo {
  id: string
  target_role: string
  progress_percentage: number
  status: string
  created_at: string
}

export interface UpcomingTaskInfo {
  week: number
  title: string
  objective: string
  is_completed: boolean
}

export interface DashboardSummary {
  total_resumes: number
  total_jds: number
  total_interviews: number
  resume_score: number | null
  avg_ats_score: number | null
  latest_job_match_score: number | null
  avg_match_score: number | null
  interviews_completed: number
  avg_interview_score: number | null
  learning_progress_percentage: number
  active_resume?: ActiveResumeInfo | null
  active_roadmap?: ActiveRoadmapInfo | null
  upcoming_learning_tasks: UpcomingTaskInfo[]
  recent_activity: ActivityItem[]
}
