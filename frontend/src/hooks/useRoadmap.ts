import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { roadmapApi } from '../api/roadmap'
import type { RoadmapGenerateRequest, RoadmapProgressUpdate } from '../types/roadmap'
import { getApiErrorMessage } from '../lib/apiError'

export function useUserRoadmaps() {
  return useQuery({
    queryKey: ['user_roadmaps'],
    queryFn: () => roadmapApi.getRoadmaps(),
  })
}

export function useRoadmap(id?: string) {
  return useQuery({
    queryKey: ['roadmap', id],
    queryFn: () => roadmapApi.getRoadmapById(id!),
    enabled: Boolean(id),
  })
}

export function useGenerateRoadmap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RoadmapGenerateRequest) => roadmapApi.generateRoadmap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roadmaps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('AI Learning Roadmap generated successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useUpdateRoadmapProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RoadmapProgressUpdate }) =>
      roadmapApi.updateProgress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roadmaps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Roadmap progress updated!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useDeleteRoadmap() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => roadmapApi.deleteRoadmap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_roadmaps'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Learning Roadmap deleted.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
