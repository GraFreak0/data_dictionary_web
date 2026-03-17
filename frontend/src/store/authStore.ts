import { create } from 'zustand'
import { authService } from '../services/auth'
import type { User } from '../types'

// Module-level flag — set SYNCHRONOUSLY before any async work so concurrent
// calls (React StrictMode double-invoke, HMR, etc.) can never race.
let _initStarted = false

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isInitialized: boolean

  initialize: () => Promise<void>
  login: (username: string, password: string) => Promise<User>
  signup: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  clearAuth: () => void
  updateUser: (updates: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: authService.getStoredToken(),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // Synchronous guard — prevents any second call from running,
    // regardless of timing (StrictMode, HMR, concurrent renders).
    if (_initStarted) return
    _initStarted = true

    const token = authService.getStoredToken()
    if (!token) {
      set({ isInitialized: true, isAuthenticated: false, user: null })
      return
    }

    set({ isLoading: true })
    try {
      const user = await authService.getMe()
      authService.saveUser(user)
      set({ user, token, isAuthenticated: true, isLoading: false, isInitialized: true })
    } catch {
      // Token was invalid or server unreachable — clear and proceed as guest.
      authService.clearAuth()
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true })
    }
  },

  login: async (username: string, password: string): Promise<User> => {
    set({ isLoading: true })
    try {
      const response = await authService.login({ username, password })
      authService.saveToken(response.token)
      authService.saveUser(response.user)
      set({ user: response.user, token: response.token, isAuthenticated: true, isLoading: false })
      return response.user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  signup: async (username: string, email: string, password: string) => {
    set({ isLoading: true })
    try {
      await authService.signup({ username, email, password })
      set({ isLoading: false })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    // Fire-and-forget the API call — clear state immediately so the UI
    // responds without waiting for the server.
    authService.logout().catch(() => {})
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  // Called by the Axios 401 interceptor — synchronous, no async.
  // isInitialized is intentionally NOT reset so ProtectedRoute redirects
  // cleanly via React Router instead of flashing the loading screen.
  clearAuth: () => {
    authService.clearAuth()
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  updateUser: (updates: Partial<User>) => {
    const { user } = get()
    if (user) {
      const updated = { ...user, ...updates }
      authService.saveUser(updated)
      set({ user: updated })
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}))
