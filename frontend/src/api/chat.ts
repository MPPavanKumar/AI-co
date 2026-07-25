import apiClient from './axios'
import type { ChatMessage, ChatHistoryResponse, CopilotContextSummary } from '../types/chat'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const chatApi = {
  sendMessage: async (message: string, category: string = 'general'): Promise<ChatMessage> => {
    const response = await apiClient.post<ChatMessage>(
      '/chat/send',
      { message, category },
      { headers: jsonHeaders, timeout: 120000 }
    )
    return response.data
  },

  getHistory: async (): Promise<ChatHistoryResponse> => {
    const response = await apiClient.get<ChatHistoryResponse>('/chat/history', { headers: jsonHeaders })
    return response.data
  },

  getContext: async (): Promise<CopilotContextSummary> => {
    const response = await apiClient.get<CopilotContextSummary>('/chat/context', { headers: jsonHeaders })
    return response.data
  },

  clearHistory: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>('/chat/history', { headers: jsonHeaders })
    return response.data
  },
}
