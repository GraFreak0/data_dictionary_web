import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, BookOpen, Lock, User, Mail, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import toast from 'react-hot-toast'

interface FormState {
  username: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Contains lowercase', pass: /[a-z]/.test(password) },
  ]

  const strength = checks.filter((c) => c.pass).length
  const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'][strength - 1] || ''
  const strengthColor = ['bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500'][strength - 1] || 'bg-[var(--bg-tertiary)]'

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1 h-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i <= strength ? strengthColor : 'bg-[var(--bg-tertiary)]'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((check) => (
            <span
              key={check.label}
              className={`flex items-center gap-1 text-xs ${
                check.pass ? 'text-emerald-500' : 'text-[var(--text-muted)]'
              }`}
            >
              <CheckCircle size={11} className={check.pass ? 'opacity-100' : 'opacity-30'} />
              {check.label}
            </span>
          ))}
        </div>
        {strengthLabel && (
          <span className={`text-xs font-medium ${
            strength === 4 ? 'text-emerald-500' :
            strength === 3 ? 'text-yellow-500' :
            strength === 2 ? 'text-amber-500' : 'text-red-500'
          }`}>
            {strengthLabel}
          </span>
        )}
      </div>
    </div>
  )
}

export function SignUp() {
  const navigate = useNavigate()
  const { signup, isLoading } = useAuthStore()

  const [form, setForm] = useState<FormState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const updateField = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
    setErrors((er) => ({ ...er, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (form.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      newErrors.username = 'Username can only contain letters, numbers and underscores'
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!form.password) {
      newErrors.password = 'Password is required'
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await signup(form.username.trim(), form.email.trim(), form.password)
      toast.success('Account created! Please sign in.')
      navigate('/signin')
    } catch (err: unknown) {
      const error = err as { message?: string }
      const msg = error?.message || 'Failed to create account'
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-secondary)] px-4 py-8">
      {/* Background */}
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Create Account</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Join Data Dictionary today
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={form.username}
              onChange={updateField('username')}
              error={errors.username}
              leftIcon={<User size={16} />}
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={updateField('email')}
              error={errors.email}
              leftIcon={<Mail size={16} />}
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={form.password}
                onChange={updateField('password')}
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
                autoComplete="new-password"
              />
              <PasswordStrength password={form.password} />
            </div>

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              error={errors.confirmPassword}
              leftIcon={<Lock size={16} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="pointer-events-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
            />

            <Button type="submit" fullWidth loading={isLoading} size="lg" className="mt-2">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Already have an account?{' '}
              <Link
                to="/signin"
                className="font-medium text-primary-500 hover:text-primary-400 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
