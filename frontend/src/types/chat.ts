export interface ChatMessage {
  id: string
  user_id: string
  sender: 'user' | 'assistant'
  message: string
  category?: string | null
  created_at: string
}

export interface ChatHistoryResponse {
  messages: ChatMessage[]
  total_count: number
}

export interface CopilotContextSummary {
  resume_name?: string | null
  ats_score?: number | null
  target_role?: string | null
  match_score?: number | null
  interviews_completed: number
  roadmap_progress: number
}
