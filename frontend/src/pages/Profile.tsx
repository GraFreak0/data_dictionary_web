import React, { useState, useEffect } from 'react'
import {
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Download,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/auth'
import { adminService } from '../services/admin'
import { Card, CardHeader } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge, RoleBadge, StatusBadge } from '../components/ui/Badge'
import { getInitials, formatDate, formatRelativeTime } from '../utils/format'
import toast from 'react-hot-toast'
import type { ActivityLog } from '../types'

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--border-color)] last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
        <div className="text-sm font-medium text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  )
}

function ChangePasswordForm() {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.current_password) e.current_password = 'Current password is required'
    if (!form.new_password) e.new_password = 'New password is required'
    else if (form.new_password.length < 8) e.new_password = 'Password must be at least 8 characters'
    if (!form.confirm_password) e.confirm_password = 'Please confirm new password'
    else if (form.new_password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await authService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      })
      toast.success('Password changed successfully')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Current Password"
        name="current_password"
        type={showCurrent ? 'text' : 'password'}
        value={form.current_password}
        onChange={(e) => {
          setForm((f) => ({ ...f, current_password: e.target.value }))
          setErrors((er) => ({ ...er, current_password: '' }))
        }}
        error={errors.current_password}
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="pointer-events-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <Input
        label="New Password"
        name="new_password"
        type={showNew ? 'text' : 'password'}
        value={form.new_password}
        onChange={(e) => {
          setForm((f) => ({ ...f, new_password: e.target.value }))
          setErrors((er) => ({ ...er, new_password: '' }))
        }}
        error={errors.new_password}
        leftIcon={<Lock size={16} />}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="pointer-events-auto text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <Input
        label="Confirm New Password"
        name="confirm_password"
        type="password"
        value={form.confirm_password}
        onChange={(e) => {
          setForm((f) => ({ ...f, confirm_password: e.target.value }))
          setErrors((er) => ({ ...er, confirm_password: '' }))
        }}
        error={errors.confirm_password}
        leftIcon={<Lock size={16} />}
      />
      <Button type="submit" loading={loading} icon={<CheckCircle size={16} />}>
        Change Password
      </Button>
    </form>
  )
}

function ActivityTable({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state py-10">
        <div className="empty-state-icon">
          <Activity size={24} className="text-[var(--text-muted)]" />
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">No activity recorded</p>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="data-table table-fixed w-full">
        <thead>
          <tr>
            <th className="w-[28%]">Action</th>
            <th className="w-[38%]">Resource</th>
            <th className="w-[22%]">Time</th>
            <th className="w-[12%]">IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="align-top">
                <Badge variant="default" className="whitespace-normal break-words">{log.action}</Badge>
              </td>
              <td className="align-top">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] break-all">{log.resource_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{log.resource_type}</p>
                </div>
              </td>
              <td className="align-top">
                <div>
                  <p className="text-sm">{formatRelativeTime(log.timestamp)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(log.timestamp)}</p>
                </div>
              </td>
              <td className="align-top">
                <code className="text-xs font-mono break-all">{log.ip_address || '—'}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Profile() {
  const { user } = useAuthStore()
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info')

  useEffect(() => {
    // Only load activity if user is admin, otherwise show empty
    if (user?.role === 'admin') {
      adminService
        .getActivityLogs()
        .then((logs) => setActivityLogs(logs.slice(0, 20)))
        .catch(() => {})
        .finally(() => setLogsLoading(false))
    } else {
      setLogsLoading(false)
    }
  }, [user])

  if (!user) return null

  const tabs = [
    { id: 'info', label: 'Profile Info' },
    { id: 'security', label: 'Security' },
    { id: 'activity', label: 'Activity' },
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings and preferences</p>
      </div>

      {/* Profile card */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white shadow-lg shadow-primary-600/20">
            {getInitials(user.username)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{user.username}</h2>
            <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <RoleBadge role={user.role} />
              <StatusBadge active={user.is_active !== false} />
              {user.can_export && (
                <Badge variant="success" dot>
                  <Download size={10} />
                  Export Enabled
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'info' && (
        <Card>
          <CardHeader title="Account Information" />
          <InfoRow icon={<User size={16} />} label="Username" value={user.username} />
          <InfoRow icon={<Mail size={16} />} label="Email" value={user.email} />
          <InfoRow
            icon={<Shield size={16} />}
            label="Role"
            value={<RoleBadge role={user.role} />}
          />
          <InfoRow
            icon={<Download size={16} />}
            label="Export Access"
            value={
              user.can_export ? (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle size={14} /> Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <XCircle size={14} /> Disabled
                </span>
              )
            }
          />
          {user.created_at && (
            <InfoRow
              icon={<Calendar size={16} />}
              label="Member Since"
              value={formatDate(user.created_at)}
            />
          )}
          {user.last_login && (
            <InfoRow
              icon={<Clock size={16} />}
              label="Last Login"
              value={formatRelativeTime(user.last_login)}
            />
          )}
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader
            title="Change Password"
            subtitle="Update your account password"
          />
          <ChangePasswordForm />
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card padding="none">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <CardHeader
              title="Recent Activity"
              subtitle="Your recent actions in the system"
            />
          </div>
          <div className="p-6">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <div className="loading-spinner" />
              </div>
            ) : (
              <ActivityTable logs={activityLogs} />
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
