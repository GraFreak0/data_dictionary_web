import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Layout } from './components/layout/Layout'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Dashboard } from './pages/Dashboard'
import { Profile } from './pages/Profile'
import { Admin } from './pages/Admin'
import { Groups } from './pages/Groups'

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

// Listens for 401 events fired by the Axios interceptor and clears auth
// state reactively — no hard page reload / blank flash.
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const location = useLocation()

  if (!isInitialized) return <LoadingScreen />
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }
  return <>{children}</>
}

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

// If already logged in, redirect away from auth pages.
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuthStore()

  if (!isInitialized) return <LoadingScreen />
  // Redirect to dashboard — the user chose where to go at sign-in time.
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { initialize, isInitialized } = useAuthStore()

  // initialize() has its own module-level guard against double invocation;
  // calling it unconditionally here is safe.
  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isInitialized) return <LoadingScreen />

  return (
    <>
      <UnauthorizedHandler />
      <Routes>
        <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/groups" element={<AdminRoute><Groups /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
