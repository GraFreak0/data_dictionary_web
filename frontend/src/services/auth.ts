import api from './api'
import type {
  User,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  ChangePasswordPayload,
} from '../types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials)
    return response.data
  },

  async signup(credentials: SignupCredentials): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/signup', credentials)
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/api/auth/me')
    return response.data
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/api/auth/change-password', payload)
    return response.data
  },

  saveToken(token: string): void {
    localStorage.setItem('auth_token', token)
  },

  saveUser(user: User): void {
    localStorage.setItem('auth_user', JSON.stringify(user))
  },

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token')
  },

  getStoredUser(): User | null {
    const stored = localStorage.getItem('auth_user')
    if (!stored) return null
    try {
      return JSON.parse(stored) as User
    } catch {
      return null
    }
  },

  clearAuth(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  },
}
