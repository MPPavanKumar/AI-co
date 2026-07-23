import apiClient from './axios'
import type { LoginRequest, RegisterRequest, TokenResponse, User, ProfileUpdateRequest } from '../types/auth'

const jsonHeaders = { 'Content-Type': 'application/json' }

export const authApi = {
  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/register', data, { headers: jsonHeaders })
    return response.data
  },

  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', data, { headers: jsonHeaders })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me', { headers: jsonHeaders })
    return response.data
  },

  updateProfile: async (data: ProfileUpdateRequest): Promise<User> => {
    const response = await apiClient.put<User>('/auth/profile', data, { headers: jsonHeaders })
    return response.data
  },
}
