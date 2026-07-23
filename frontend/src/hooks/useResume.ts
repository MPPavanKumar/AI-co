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
      toast.success('Resume analyzed successfully! 🎯')
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
