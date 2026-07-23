import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth'
import type { LoginRequest, RegisterRequest, ProfileUpdateRequest } from '../types/auth'
import { getApiErrorMessage } from '../lib/apiError'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.access_token)
      toast.success(`Welcome back, ${response.user.full_name ?? 'there'}!`)
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: (response) => {
      setAuth(response.user, response.access_token)
      toast.success('Account created! Welcome to CareerPilot AI 🚀')
      navigate('/dashboard')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}

export function useLogout() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return () => {
    logout()
    queryClient.clear()
    toast.success('Logged out successfully.')
    navigate('/login')
  }
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })
}
