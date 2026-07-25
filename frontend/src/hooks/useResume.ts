import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { resumeApi } from '../api/resume'
import { getApiErrorMessage } from '../lib/apiError'

export function useUploadResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['resume-latest'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Resume uploaded & analyzed successfully! 🎯')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useResumeAnalyses() {
  return useQuery({
    queryKey: ['resume-analyses'],
    queryFn: resumeApi.getAnalyses,
  })
}

export function useLatestResume() {
  return useQuery({
    queryKey: ['resume-latest'],
    queryFn: resumeApi.getLatest,
  })
}

export function useResumeById(id: string | null) {
  return useQuery({
    queryKey: ['resume', id],
    queryFn: () => resumeApi.getById(id!),
    enabled: !!id,
  })
}

export function useRenameResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, display_name }: { id: string; display_name: string }) =>
      resumeApi.renameResume(id, display_name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['resume-latest'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Resume renamed!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useSetActiveResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeApi.setActiveResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['resume-latest'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Active resume updated! ⭐')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useDeleteResumeAnalysis() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeApi.deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume-analyses'] })
      queryClient.invalidateQueries({ queryKey: ['resume-latest'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Resume deleted successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
