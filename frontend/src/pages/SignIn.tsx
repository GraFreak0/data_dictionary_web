import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Lock, User, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

export function SignIn() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading } = useAuthStore()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  // Where to go after login for non-admins (e.g. when redirected from a protected page)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

  const validate = () => {
    const e: typeof errors = {}
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      const user = await login(form.username.trim(), form.password)
      toast.success(`Welcome back, ${user.username}!`)

      // Admins always land on the admin panel
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate(from === '/admin' || from === '/groups' ? '/' : from, { replace: true })
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      const msg = error?.message || 'Invalid username or password'
      toast.error(msg)
      setErrors({ password: 'Invalid credentials' })
    }
  }

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
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

            <Button type="submit" fullWidth loading={isLoading} size="lg" className="mt-6">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Admin hint */}
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2.5 dark:bg-purple-900/20">
            <Shield size={14} className="shrink-0 text-purple-500" />
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Admin accounts are automatically redirected to the Admin panel after sign in.
            </p>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Data Dictionary. All rights reserved.
        </p>
      </div>
    </div>
  )
}
