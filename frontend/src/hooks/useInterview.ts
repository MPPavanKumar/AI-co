import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview'
import type {
  InterviewGenerateRequest,
  SingleQuestionEvaluateRequest,
  InterviewAnswerFeedbackRequest,
} from '../types/interview'
import { getApiErrorMessage } from '../lib/apiError'

export function useEvaluateAnswerFeedback() {
  return useMutation({
    mutationFn: (data: InterviewAnswerFeedbackRequest) => interviewApi.evaluateAnswerFeedback(data),
    onSuccess: () => {
      toast.success('AI Feedback generated successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useInterviewSessions() {
  return useQuery({
    queryKey: ['interview_sessions'],
    queryFn: () => interviewApi.getSessions(),
  })
}

export function useInterviewSession(id?: string) {
  return useQuery({
    queryKey: ['interview_session', id],
    queryFn: () => interviewApi.getSessionById(id!),
    enabled: Boolean(id),
  })
}

export function useGenerateInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InterviewGenerateRequest) => interviewApi.generateSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Interview generated! 45-min timer started.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useEvaluateQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: SingleQuestionEvaluateRequest }) =>
      interviewApi.evaluateQuestion(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Question evaluated!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useCompleteInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => interviewApi.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Interview completed! Final report generated.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useDeleteInterviewSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => interviewApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview_sessions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_summary'] })
      toast.success('Interview session deleted.')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
