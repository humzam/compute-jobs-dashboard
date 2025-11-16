export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
}

export interface AuthResponse {
  user: User
  message: string
}

export interface AuthError {
  detail?: string
  email?: string[]
  password?: string[]
  username?: string[]
  first_name?: string[]
  last_name?: string[]
  password_confirm?: string[]
  non_field_errors?: string[]
}