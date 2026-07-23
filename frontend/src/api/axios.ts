import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  // NOTE: Do NOT set a global Content-Type default here.
  // Axios automatically sets Content-Type based on the request body:
  //   - JSON body   → application/json
  //   - FormData    → multipart/form-data; boundary=...
  // A global header would override this and break multipart uploads (HTTP 422).
  timeout: 60000,
})

// Request interceptor: attach JWT token from Zustand store or localStorage
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token || localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401 globally (user token expired or missing)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const data = error.response?.data as { detail?: string } | undefined
      const detail = data?.detail
      const detailStr = typeof detail === 'string' ? detail.toLowerCase() : ''

      // Only force logout if the 401 error is actually a user auth/token issue
      const isUserAuthFailure =
        !detail ||
        detailStr.includes('authentication') ||
        detailStr.includes('token') ||
        detailStr.includes('session') ||
        detailStr.includes('log in') ||
        detailStr.includes('bearer')

      if (isUserAuthFailure) {
        useAuthStore.getState().logout()
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
