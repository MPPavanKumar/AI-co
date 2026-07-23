import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '../api/dashboard'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard_summary'],
    queryFn: () => dashboardApi.getSummary(),
    refetchOnWindowFocus: true,
  })
}
