// Common types will be defined here
export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  username: string
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

export interface ApiResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

export interface ApiError {
  detail?: string
  message?: string
  [key: string]: any
}