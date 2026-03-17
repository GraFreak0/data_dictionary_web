import React, { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/layout/Layout'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { Groups } from './pages/Groups'

// Loading screen
function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-secondary)]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  )
}

// Listens for 401 events from the Axios interceptor and clears auth reactively
// so React Router redirects via the route guards — no hard page reload.
function UnauthorizedHandler() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()

  useEffect(() => {
    function handle() {
      clearAuth()
      navigate('/signin', { replace: true })
    }
    window.addEventListener('auth:unauthorized', handle)
    return () => window.removeEventListener('auth:unauthorized', handle)
  }, [clearAuth, navigate])

  return null
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  return <>{children}</>
}

// Admin-only route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

// Auth route — redirect to role-appropriate home if already logged in
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized, user } = useAuthStore()

  if (!isInitialized) return <LoadingScreen />
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { initialize, isInitialized } = useAuthStore()
  const initCalledRef = useRef(false)

  useEffect(() => {
    // Prevent double-invocation from React StrictMode in development
    if (initCalledRef.current) return
    initCalledRef.current = true
    initialize()
  }, [initialize])

  if (!isInitialized) return <LoadingScreen />

  return (
    <>
      <UnauthorizedHandler />
      <Routes>
        {/* Auth routes */}
        <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

        {/* Protected routes with shared layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/groups" element={<AdminRoute><Groups /></AdminRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
