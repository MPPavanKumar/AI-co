import apiClient from './axios'
import type { AnalyticsSummary } from '../types/analytics'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>('/analytics/summary', { headers: jsonHeaders })
    return response.data
  },
}
