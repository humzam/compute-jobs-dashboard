import { apiClient } from './api/client'
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types/auth'

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login/', credentials)
    return response.data
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register/', data)
    return response.data
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout/')
  }

  async refreshToken(): Promise<void> {
    await apiClient.post('/auth/refresh/')
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me/')
    return response.data
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put('/auth/me/', data)
    return response.data
  }
}

export const authService = new AuthService()