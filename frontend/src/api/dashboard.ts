import apiClient from './axios'
import type { DashboardSummary } from '../types/dashboard'

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get<DashboardSummary>('/dashboard/summary')
    return res.data
  },
}
