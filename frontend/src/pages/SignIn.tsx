import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Lock, User, Shield, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

// Which button the user clicked
type LoginDest = 'dashboard' | 'admin'

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  // Track which submit button was clicked so we know where to navigate
  const [pendingDest, setPendingDest] = useState<LoginDest | null>(null)

  // Restore the page the user was trying to reach before being redirected
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const validate = () => {
    const e: typeof errors = {}
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (dest: LoginDest) => {
    if (!validate()) return
    setPendingDest(dest)

    try {
      const user = await login(form.username.trim(), form.password)

      if (dest === 'admin') {
        if (user.role !== 'admin') {
          toast.error('Admin access is required to sign in as admin.')
          return
        }
        toast.success(`Welcome, ${user.username}! Redirecting to Admin panel…`)
        navigate('/admin', { replace: true })
      } else {
        toast.success(`Welcome back, ${user.username}!`)
        // If the user was redirected from an admin-only page, fall back to '/'
        const safeDest = from === '/admin' || from === '/groups' ? '/' : from
        navigate(safeDest, { replace: true })
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message || 'Invalid username or password')
      setErrors({ password: 'Invalid credentials' })
    } finally {
      setPendingDest(null)
    }
  }

  const loading = isLoading || pendingDest !== null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Data Dictionary</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="card space-y-5">
          {/* Fields */}
          <div className="space-y-4">
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => {
                setForm((f) => ({ ...f, username: e.target.value }))
                setErrors((er) => ({ ...er, username: undefined }))
              }}
              error={errors.username}
              leftIcon={<User size={16} />}
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => {
                setForm((f) => ({ ...f, password: e.target.value }))
                setErrors((er) => ({ ...er, password: undefined }))
              }}
              error={errors.password}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="pointer-events-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
            />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border-color)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--card-bg)] px-2 text-[var(--text-muted)]">
                choose sign-in destination
              </span>
            </div>
          </div>

          {/* Two sign-in buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Normal sign in — always goes to Dashboard */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('dashboard')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                ${loading && pendingDest === 'dashboard'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 opacity-80'
                  : 'border-[var(--border-color)] hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
                }
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
                {loading && pendingDest === 'dashboard' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                ) : (
                  <LayoutDashboard size={18} className="text-primary-600 dark:text-primary-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Sign In</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Go to Dashboard</p>
              </div>
            </button>

            {/* Admin sign in — goes to Admin panel (admins only) */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit('admin')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                ${loading && pendingDest === 'admin'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 opacity-80'
                  : 'border-[var(--border-color)] hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                }
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40">
                {loading && pendingDest === 'admin' ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
                ) : (
                  <Shield size={18} className="text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Sign In as Admin</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">Go to Admin Panel</p>
              </div>
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-[var(--text-muted)]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Data Dictionary. All rights reserved.
        </p>
      </div>
    </div>
  )
}
