import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { chatApi } from '../api/chat'
import { getApiErrorMessage } from '../lib/apiError'

export function useChatHistory() {
  return useQuery({
    queryKey: ['chat-history'],
    queryFn: chatApi.getHistory,
  })
}

export function useCopilotContext() {
  return useQuery({
    queryKey: ['copilot-context'],
    queryFn: chatApi.getContext,
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ message, category }: { message: string; category?: string }) =>
      chatApi.sendMessage(message, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useClearChatHistory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: chatApi.clearHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history'] })
      toast.success('Conversation history cleared!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
