import apiClient from './axios'
import { useAuthStore } from '../store/authStore'
import type { AnalysisStatus, ResumeAnalysis, ResumeListItem } from '../types/resume'

/** JSON headers for non-multipart requests */
const jsonHeaders = { 'Content-Type': 'application/json' }

export const resumeApi = {
  upload: async (file: File): Promise<AnalysisStatus> => {
    const formData = new FormData()
    // FastAPI parameter name must match exactly: `file`
    formData.append('file', file)

    // Explicitly attach Authorization here (in addition to the interceptor) to
    // guarantee it survives FormData requests where per-request headers are merged.
    const token = useAuthStore.getState().token || localStorage.getItem('access_token')
    const response = await apiClient.post<AnalysisStatus>('/resume/upload', formData, {
      // Do NOT set Content-Type for FormData — Axios must set it with the boundary.
      // Only inject Authorization.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 120000,  // 2 min — AI analysis can take time
    })
    return response.data
  },

  getAnalyses: async (): Promise<ResumeListItem[]> => {
    const response = await apiClient.get<ResumeListItem[]>('/resume/analyses', { headers: jsonHeaders })
    return response.data
  },

  getLatest: async (): Promise<ResumeAnalysis | null> => {
    const response = await apiClient.get<ResumeAnalysis | null>('/resume/latest', { headers: jsonHeaders })
    return response.data
  },

  getById: async (id: string): Promise<ResumeAnalysis> => {
    const response = await apiClient.get<ResumeAnalysis>(`/resume/analyses/${id}`, { headers: jsonHeaders })
    return response.data
  },

  deleteAnalysis: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/resume/analyses/${id}`, { headers: jsonHeaders })
    return response.data
  },
}

