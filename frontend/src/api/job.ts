import apiClient from './axios'
import type { JobDescription, JDParseRequest, JobMatch, MatchAnalyzeRequest } from '../types/job'

export const jobApi = {
  parseJd: async (data: JDParseRequest): Promise<JobDescription> => {
    const res = await apiClient.post<JobDescription>('/jd/parse', data)
    return res.data
  },

  getJds: async (): Promise<JobDescription[]> => {
    const res = await apiClient.get<JobDescription[]>('/jd')
    return res.data
  },

  getJdById: async (id: string): Promise<JobDescription> => {
    const res = await apiClient.get<JobDescription>(`/jd/${id}`)
    return res.data
  },

  deleteJd: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/jd/${id}`)
    return res.data
  },

  analyzeMatch: async (data: MatchAnalyzeRequest): Promise<JobMatch> => {
    const res = await apiClient.post<JobMatch>('/match/analyze', data)
    return res.data
  },

  getMatchHistory: async (): Promise<JobMatch[]> => {
    const res = await apiClient.get<JobMatch[]>('/match/history')
    return res.data
  },
}
