import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api/analytics'

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ['analytics-summary'],
    queryFn: analyticsApi.getSummary,
  })
}
