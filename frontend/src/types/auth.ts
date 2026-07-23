export interface User {
  id: string
  email: string
  full_name: string | null
  college: string | null
  branch: string | null
  graduation_year: number | null
  avatar_url: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
  college?: string
  branch?: string
  graduation_year?: number
}

export interface ProfileUpdateRequest {
  full_name?: string
  college?: string
  branch?: string
  graduation_year?: number
  avatar_url?: string
}
