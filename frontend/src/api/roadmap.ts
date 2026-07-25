import apiClient from './axios'
import type {
  RoadmapResponse,
  RoadmapGenerateRequest,
  RoadmapProgressUpdate,
} from '../types/roadmap'

export const roadmapApi = {
  generateRoadmap: async (data: RoadmapGenerateRequest): Promise<RoadmapResponse> => {
    const res = await apiClient.post<RoadmapResponse>('/roadmap/generate', data)
    return res.data
  },

  getRoadmaps: async (): Promise<RoadmapResponse[]> => {
    const res = await apiClient.get<RoadmapResponse[]>('/roadmap/roadmaps')
    return res.data
  },

  getRoadmapById: async (id: string): Promise<RoadmapResponse> => {
    const res = await apiClient.get<RoadmapResponse>(`/roadmap/${id}`)
    return res.data
  },

  updateProgress: async (id: string, data: RoadmapProgressUpdate): Promise<RoadmapResponse> => {
    const res = await apiClient.patch<RoadmapResponse>(`/roadmap/${id}/progress`, data)
    return res.data
  },

  deleteRoadmap: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/roadmap/${id}`)
    return res.data
  },
}
