export interface WeeklyPlanItem {
  week: number
  title: string
  description: str
  objectives: string[]
}

export interface RecommendedCourse {
  title: string
  provider: string
  link?: string
  focus: string
}

export interface LearningResource {
  title: string
  resource_type: string
  description: string
  link?: string
}

export interface PracticeProject {
  title: string
  description: string
  tech_stack: string[]
}

export interface RoadmapGenerateRequest {
  target_role: string
  resume_id?: string
  job_match_id?: string
}

export interface RoadmapProgressUpdate {
  progress_percentage: number
  status?: string
}

export interface RoadmapResponse {
  id: string
  target_role: string
  resume_id?: string | null
  job_match_id?: string | null
  current_skills: string[]
  missing_skills: string[]
  weekly_plan: WeeklyPlanItem[]
  recommended_courses: RecommendedCourse[]
  learning_resources: LearningResource[]
  practice_projects: PracticeProject[]
  estimated_completion_time: string
  progress_percentage: number
  status: string
  created_at: string
  updated_at: string
}
