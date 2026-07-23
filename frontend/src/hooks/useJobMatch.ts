import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { jobApi } from '../api/job'
import type { JDParseRequest, MatchAnalyzeRequest } from '../types/job'
import { getApiErrorMessage } from '../lib/apiError'

export function useJdList() {
  return useQuery({
    queryKey: ['jds'],
    queryFn: () => jobApi.getJds(),
  })
}

export function useMatchHistory() {
  return useQuery({
    queryKey: ['job_matches'],
    queryFn: () => jobApi.getMatchHistory(),
  })
}

export function useParseJd() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: JDParseRequest) => jobApi.parseJd(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jds'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Job Description saved successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useAnalyzeMatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MatchAnalyzeRequest) => jobApi.analyzeMatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job_matches'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Resume Job Match Analysis completed!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useDeleteJd() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => jobApi.deleteJd(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jds'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Job Description deleted.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
