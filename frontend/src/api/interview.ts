import apiClient from './axios'
import type {
  InterviewSession,
  InterviewGenerateRequest,
  SingleQuestionEvaluateRequest,
} from '../types/interview'

export const interviewApi = {
  generateSession: async (data: InterviewGenerateRequest): Promise<InterviewSession> => {
    const res = await apiClient.post<InterviewSession>('/interview/generate', data)
    return res.data
  },

  evaluateQuestion: async (
    sessionId: string,
    data: SingleQuestionEvaluateRequest
  ): Promise<InterviewSession> => {
    const res = await apiClient.post<InterviewSession>(
      `/interview/${sessionId}/evaluate-question`,
      data
    )
    return res.data
  },

  completeSession: async (sessionId: string): Promise<InterviewSession> => {
    const res = await apiClient.post<InterviewSession>(`/interview/${sessionId}/complete`)
    return res.data
  },

  getSessions: async (): Promise<InterviewSession[]> => {
    const res = await apiClient.get<InterviewSession[]>('/interview/sessions')
    return res.data
  },

  getSessionById: async (id: string): Promise<InterviewSession> => {
    const res = await apiClient.get<InterviewSession>(`/interview/${id}`)
    return res.data
  },

  deleteSession: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/interview/${id}`)
    return res.data
  },
}
