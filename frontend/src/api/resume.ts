import apiClient from './axios'
import { useAuthStore } from '../store/authStore'
import type { AnalysisStatus, ResumeAnalysis, ResumeListItem } from '../types/resume'

/** JSON headers for non-multipart requests */
const jsonHeaders = { 'Content-Type': 'application/json' }

export const resumeApi = {
  upload: async (file: File): Promise<AnalysisStatus> => {
    const formData = new FormData()
    formData.append('file', file)

    const token = useAuthStore.getState().token || localStorage.getItem('access_token')
    const response = await apiClient.post<AnalysisStatus>('/resume/upload', formData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 120000,
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

  renameResume: async (id: string, display_name: string): Promise<ResumeAnalysis> => {
    const response = await apiClient.patch<ResumeAnalysis>(
      `/resume/${id}/rename`,
      { display_name },
      { headers: jsonHeaders }
    )
    return response.data
  },

  setActiveResume: async (id: string): Promise<ResumeAnalysis> => {
    const response = await apiClient.patch<ResumeAnalysis>(
      `/resume/${id}/set-active`,
      {},
      { headers: jsonHeaders }
    )
    return response.data
  },

  deleteAnalysis: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/resume/analyses/${id}`, { headers: jsonHeaders })
    return response.data
  },
}
