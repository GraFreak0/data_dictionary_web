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
import { SchemaBrowser } from './pages/SchemaBrowser'
import { Analytics } from './pages/Analytics'
import { Files } from './pages/Files'
import { Modal } from './components/ui/Modal'
import { Button } from './components/ui/Button'
import { useInactivityTimeout } from './hooks/useInactivityTimeout'

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

// Watches for 10 minutes of inactivity and signs the user out automatically.
// Shows a 60-second countdown warning before the timeout fires.
function SessionTimeoutGuard() {
  const { isAuthenticated, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleTimeout = () => {
    clearAuth()
    navigate('/signin', { replace: true, state: { reason: 'inactivity' } })
  }

  const { showWarning, secondsRemaining, resetTimer } = useInactivityTimeout({
    enabled: isAuthenticated,
    onTimeout: handleTimeout,
  })

  return (
    <Modal
      isOpen={showWarning}
      onClose={resetTimer}
      title="Session expiring soon"
      size="sm"
      closable={false}
      footer={
        <>
          <Button variant="secondary" onClick={handleTimeout}>
            Sign out now
          </Button>
          <Button variant="primary" onClick={resetTimer}>
            Stay logged in
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--text-secondary)]">
        You've been inactive for a while. You'll be signed out automatically in{' '}
        <span className="font-semibold text-[var(--text-primary)]">
          {secondsRemaining}s
        </span>{' '}
        to protect your session.
      </p>
    </Modal>
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
      <SessionTimeoutGuard />
      <Routes>
        <Route path="/signin" element={<AuthRoute><SignIn /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/schemas" element={<SchemaBrowser />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/groups" element={<AdminRoute><Groups /></AdminRoute>} />
          <Route path="/files" element={<AdminRoute><Files /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
