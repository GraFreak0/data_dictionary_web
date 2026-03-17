import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  Users,
  UserPlus,
  Shield,
  Pencil,
  Trash2,
  Plus,
  Activity,
  Search,
  ToggleLeft,
  ToggleRight,
  Key,
  Download,
  KeyRound,
  Database,
  Table2,
  Columns,
  List,
  CheckSquare,
  Square,
  ChevronDown,
  FileDown,
  Filter,
  X,
  Calendar,
} from 'lucide-react'
import { adminService } from '../services/admin'
import { catalogService } from '../services/catalog'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge, RoleBadge, StatusBadge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { ResourceAutocomplete } from '../components/ui/ResourceAutocomplete'
import { formatDate, formatRelativeTime, getInitials } from '../utils/format'
import toast from 'react-hot-toast'
import type { User, Permission, ActivityLog, CreateUserPayload, Schema, Table } from '../types'

// ─── Create User Modal ──────────────────────────────────────────────────────

function CreateUserModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean
  onClose: () => void
  onCreated: (user: User) => void
}) {
  const [form, setForm] = useState<CreateUserPayload>({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  })
  const [errors, setErrors] = useState<Partial<CreateUserPayload>>({})
  const [loading, setLoading] = useState(false)

  const update =
    (field: keyof CreateUserPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setErrors((er) => ({ ...er, [field]: undefined }))
    }

  const validate = () => {
    const e: Partial<Record<keyof CreateUserPayload, string>> = {}
    if (!form.username.trim()) e.username = 'Username is required'
    if (!form.email.trim()) e.email = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Min 8 characters'
    setErrors(e as Partial<CreateUserPayload>)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await adminService.createUser(form)
      toast.success(`User "${user.username}" created`)
      onCreated(user)
      onClose()
      setForm({ username: '', email: '', password: '', role: 'viewer' })
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create User"
      description="Add a new user to the system"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<UserPlus size={16} />}>
            Create User
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Username"
          name="username"
          value={form.username}
          onChange={update('username')}
          error={errors.username}
          placeholder="Enter username"
          autoFocus
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          placeholder="Enter email"
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          placeholder="Min 8 characters"
        />
        <Select
          label="Role"
          name="role"
          value={form.role}
          onChange={update('role')}
          options={[
            { value: 'admin', label: 'Admin — full access' },
            { value: 'contributor', label: 'Contributor — assigned resources' },
            { value: 'viewer', label: 'Viewer — read-only' },
          ]}
        />
      </form>
    </Modal>
  )
}

// ─── Edit User Modal ─────────────────────────────────────────────────────────

function EditUserModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUpdated: (user: User) => void
}) {
  const [role, setRole] = useState(user?.role ?? 'viewer')
  const [canExport, setCanExport] = useState(user?.can_export ?? false)
  const [isActive, setIsActive] = useState(user?.is_active !== false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setRole(user.role)
      setCanExport(user.can_export)
      setIsActive(user.is_active !== false)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      const updated = await adminService.updateUser(user.id, {
        role,
        can_export: canExport,
        is_active: isActive,
      })
      toast.success('User updated')
      onUpdated(updated)
      onClose()
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      description={user ? `Editing ${user.username}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={loading} icon={<Pencil size={16} />}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as User['role'])}
          options={[
            { value: 'admin', label: 'Admin — full access' },
            { value: 'contributor', label: 'Contributor — assigned resources' },
            { value: 'viewer', label: 'Viewer — read-only' },
          ]}
        />

        {/* Export access toggle */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-color)] p-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Export Access</p>
              <p className="text-xs text-[var(--text-muted)]">Allow user to export data as PDF / other formats</p>
            </div>
          </div>
          <button
            onClick={() => setCanExport((v) => !v)}
            className={`transition-colors ${canExport ? 'text-primary-500' : 'text-[var(--text-muted)]'}`}
          >
            {canExport ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>

        {/* Account status toggle */}
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-color)] p-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Account Status</p>
            <p className="text-xs text-[var(--text-muted)]">Enable or disable this account</p>
          </div>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={`transition-colors ${isActive ? 'text-emerald-500' : 'text-[var(--text-muted)]'}`}
          >
            {isActive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────

function ResetPasswordModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  user: User | null
}) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) { setNewPassword(''); setConfirm(''); setError('') }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await adminService.resetUserPassword(user.id, newPassword)
      toast.success(`Password reset for ${user.username}`)
      onClose()
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message ?? 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      description={user ? `Set a new password for ${user.username}` : ''}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} icon={<KeyRound size={16} />}>
            Reset Password
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="New Password"
          name="new_password"
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError('') }}
          placeholder="Min 8 characters"
          autoFocus
        />
        <Input
          label="Confirm Password"
          name="confirm_password"
          type="password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError('') }}
          placeholder="Re-enter password"
        />
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </form>
    </Modal>
  )
}

// ─── Resource type metadata ───────────────────────────────────────────────────

const RESOURCE_TYPES = [
  { value: 'schema', label: 'Schema / Database', icon: <Database size={14} /> },
  { value: 'table', label: 'Table', icon: <Table2 size={14} /> },
  { value: 'column', label: 'Column', icon: <Columns size={14} /> },
]

const ACCESS_LEVELS = [
  { value: 'read', label: 'View Only', description: 'Can browse and search this resource' },
  { value: 'write', label: 'Edit Access', description: 'Can modify descriptions and metadata' },
]

// ─── Permissions Modal ────────────────────────────────────────────────────────

interface BulkItem {
  name: string
  level: 'read' | 'write'
  selected: boolean
}

function PermissionsModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  user: User | null
}) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [newPerm, setNewPerm] = useState({
    resource_type: 'schema',
    resource_name: '',
    permission_level: 'read',
  })
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // ── Bulk mode ──
  const [bulkMode, setBulkMode] = useState(false)
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkSchema, setBulkSchema] = useState('')
  const [bulkSchemas, setBulkSchemas] = useState<Schema[]>([])
  const [bulkTables, setBulkTables] = useState<Table[]>([])

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true)
      adminService
        .getUserPermissions(user.id)
        .then(setPermissions)
        .catch(() => toast.error('Failed to load permissions'))
        .finally(() => setLoading(false))
    } else {
      setPermissions([])
      setBulkMode(false)
      setBulkItems([])
    }
  }, [isOpen, user])

  // Load schemas for bulk schema/table selectors
  useEffect(() => {
    if (bulkMode && (newPerm.resource_type === 'table' || newPerm.resource_type === 'column')) {
      catalogService.getSchemas().then(setBulkSchemas).catch(() => {})
    }
  }, [bulkMode, newPerm.resource_type])

  // Load tables when bulk schema selected
  useEffect(() => {
    if (bulkMode && bulkSchema && newPerm.resource_type === 'table') {
      catalogService.getSchemaTables(bulkSchema).then(setBulkTables).catch(() => {})
    }
  }, [bulkMode, bulkSchema, newPerm.resource_type])

  const loadBulkResources = async () => {
    setBulkLoading(true)
    const alreadyGranted = new Set(
      permissions
        .filter((p) => p.resource_type === newPerm.resource_type)
        .map((p) => p.resource_name)
    )
    try {
      if (newPerm.resource_type === 'schema') {
        const schemas = await catalogService.getSchemas()
        setBulkItems(
          schemas
            .filter((s) => !alreadyGranted.has(s.name))
            .map((s) => ({ name: s.name, level: 'read', selected: true }))
        )
      } else if (newPerm.resource_type === 'table') {
        if (!bulkSchema) { toast.error('Select a schema first'); setBulkLoading(false); return }
        const tables = await catalogService.getSchemaTables(bulkSchema)
        setBulkItems(
          tables
            .filter((t) => !alreadyGranted.has(t.name))
            .map((t) => ({ name: t.name, level: 'read', selected: true }))
        )
      } else if (newPerm.resource_type === 'column') {
        if (!bulkSchema) { toast.error('Select a schema first'); setBulkLoading(false); return }
        const tables = await catalogService.getSchemaTables(bulkSchema)
        const allCols: BulkItem[] = []
        for (const t of tables) {
          const detail = await catalogService.getTableDetail(bulkSchema, t.name)
          for (const col of detail.columns ?? []) {
            if (!alreadyGranted.has(col.name)) {
              allCols.push({ name: col.name, level: 'read', selected: true })
            }
          }
        }
        setBulkItems(allCols)
      }
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleAll = (selected: boolean) => setBulkItems((prev) => prev.map((i) => ({ ...i, selected })))

  const handleGrantAll = async () => {
    if (!user) return
    const toGrant = bulkItems.filter((i) => i.selected)
    if (toGrant.length === 0) { toast.error('No resources selected'); return }
    setAdding(true)
    let successCount = 0
    for (const item of toGrant) {
      try {
        const perm = await adminService.addUserPermission(user.id, {
          resource_type: newPerm.resource_type,
          resource_name: item.name,
          permission_level: item.level,
        })
        setPermissions((prev) => [...prev, perm])
        successCount++
      } catch { /* skip duplicates silently */ }
    }
    toast.success(`Granted ${successCount} permission${successCount !== 1 ? 's' : ''}`)
    setBulkItems([])
    setBulkMode(false)
    setAdding(false)
  }

  const handleAdd = async () => {
    if (!user || !newPerm.resource_name.trim()) {
      toast.error('Please select or enter a resource name')
      return
    }
    setAdding(true)
    try {
      const perm = await adminService.addUserPermission(user.id, newPerm)
      setPermissions((prev) => [...prev, perm])
      setNewPerm((p) => ({ ...p, resource_name: '' }))
      toast.success('Permission granted')
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to add permission')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (permId: number) => {
    setDeleting(permId)
    try {
      await adminService.deletePermission(permId)
      setPermissions((prev) => prev.filter((p) => p.id !== permId))
      toast.success('Permission revoked')
    } catch {
      toast.error('Failed to revoke permission')
    } finally {
      setDeleting(null)
    }
  }

  const selectedType = RESOURCE_TYPES.find((t) => t.value === newPerm.resource_type)
  const selectedLevel = ACCESS_LEVELS.find((l) => l.value === newPerm.permission_level)
  const selectedCount = bulkItems.filter((i) => i.selected).length

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Permissions"
      description={user ? `Resource access for ${user.username}` : ''}
      size="lg"
    >
      <div className="space-y-6">
        {/* ── Add new permission ── */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Grant Permission</p>
            <button
              type="button"
              onClick={() => { setBulkMode((v) => !v); setBulkItems([]) }}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                bulkMode
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
              }`}
            >
              <List size={12} />
              {bulkMode ? 'Single Mode' : 'Bulk Mode'}
            </button>
          </div>

          {/* Resource type selector */}
          <div>
            <label className="label mb-2 block">Resource Type</label>
            <div className="grid grid-cols-3 gap-2">
              {RESOURCE_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => { setNewPerm((p) => ({ ...p, resource_type: rt.value, resource_name: '' })); setBulkItems([]) }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                    newPerm.resource_type === rt.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  }`}
                >
                  {rt.icon}
                  <span className="font-medium">{rt.label.split(' /')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {bulkMode ? (
            /* ── Bulk mode UI ── */
            <div className="space-y-3">
              {/* Schema selector for table/column types */}
              {(newPerm.resource_type === 'table' || newPerm.resource_type === 'column') && (
                <div>
                  <label className="label mb-1.5 block">Schema</label>
                  <select
                    className="input"
                    value={bulkSchema}
                    onChange={(e) => { setBulkSchema(e.target.value); setBulkItems([]) }}
                  >
                    <option value="">Select a schema…</option>
                    {bulkSchemas.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Access level for all */}
              <div>
                <label className="label mb-2 block">Default Access Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS_LEVELS.map((al) => (
                    <button
                      key={al.value}
                      type="button"
                      onClick={() => {
                        setNewPerm((p) => ({ ...p, permission_level: al.value }))
                        setBulkItems((prev) => prev.map((i) => ({ ...i, level: al.value as 'read' | 'write' })))
                      }}
                      className={`flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-all ${
                        newPerm.permission_level === al.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                      }`}
                    >
                      <span className={`text-sm font-medium ${newPerm.permission_level === al.value ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-primary)]'}`}>
                        {al.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] mt-0.5">{al.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                variant="secondary"
                icon={bulkLoading ? undefined : <List size={14} />}
                onClick={loadBulkResources}
                loading={bulkLoading}
              >
                Load Resources
              </Button>

              {bulkItems.length > 0 && (
                <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {selectedCount} / {bulkItems.length} selected
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAll(true)} className="text-xs text-primary-500 hover:underline">All</button>
                      <button onClick={() => toggleAll(false)} className="text-xs text-[var(--text-muted)] hover:underline">None</button>
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border-color)]">
                    {bulkItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setBulkItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it))}
                          className={`shrink-0 ${item.selected ? 'text-primary-500' : 'text-[var(--text-muted)]'}`}
                        >
                          {item.selected ? <CheckSquare size={15} /> : <Square size={15} />}
                        </button>
                        <span className="flex-1 font-mono text-sm text-[var(--text-primary)] truncate">{item.name}</span>
                        <select
                          className="text-xs rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-1.5 py-1 text-[var(--text-secondary)]"
                          value={item.level}
                          onChange={(e) => setBulkItems((prev) => prev.map((it, i) => i === idx ? { ...it, level: e.target.value as 'read' | 'write' } : it))}
                        >
                          <option value="read">View Only</option>
                          <option value="write">Edit Access</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bulkItems.length > 0 && (
                <Button
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={handleGrantAll}
                  loading={adding}
                  disabled={selectedCount === 0}
                >
                  Grant {selectedCount} Permission{selectedCount !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          ) : (
            /* ── Single mode UI ── */
            <div className="space-y-4">
              <div>
                <label className="label mb-1.5 block">
                  {selectedType?.label ?? 'Resource'} Name
                </label>
                <ResourceAutocomplete
                  value={newPerm.resource_name}
                  onChange={(v) => setNewPerm((p) => ({ ...p, resource_name: v }))}
                  resourceType={newPerm.resource_type}
                  placeholder={`Search or type a ${newPerm.resource_type} name…`}
                  excludeValues={permissions
                    .filter((p) => p.resource_type === newPerm.resource_type)
                    .map((p) => p.resource_name)}
                />
              </div>

              <div>
                <label className="label mb-2 block">Access Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCESS_LEVELS.map((al) => (
                    <button
                      key={al.value}
                      type="button"
                      onClick={() => setNewPerm((p) => ({ ...p, permission_level: al.value }))}
                      className={`flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-all ${
                        newPerm.permission_level === al.value
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-[var(--border-color)] hover:bg-[var(--bg-primary)]'
                      }`}
                    >
                      <span className={`text-sm font-medium ${newPerm.permission_level === al.value ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-primary)]'}`}>
                        {al.label}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] mt-0.5">{al.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newPerm.resource_name.trim() && (
                <div className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-muted)]">
                  Granting{' '}
                  <span className="font-semibold text-[var(--text-primary)]">{selectedLevel?.label}</span>{' '}
                  to{' '}
                  <span className="font-mono font-semibold text-[var(--text-primary)]">{newPerm.resource_name}</span>{' '}
                  ({newPerm.resource_type})
                </div>
              )}

              <Button
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleAdd}
                loading={adding}
                disabled={!newPerm.resource_name.trim()}
              >
                Grant Permission
              </Button>
            </div>
          )}
        </div>

        {/* ── Current permissions ── */}
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Granted Permissions ({permissions.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="loading-spinner" />
            </div>
          ) : permissions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--border-color)] py-6 text-center text-sm text-[var(--text-muted)]">
              No permissions granted yet
            </p>
          ) : (
            <div className="space-y-2">
              {permissions.map((perm) => {
                const rt = RESOURCE_TYPES.find((t) => t.value === perm.resource_type)
                const al = ACCESS_LEVELS.find((l) => l.value === perm.permission_level)
                return (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex items-center gap-1 shrink-0 text-[var(--text-muted)]">
                        {rt?.icon ?? <Database size={14} />}
                      </span>
                      <span className="font-mono text-sm text-[var(--text-primary)] truncate">
                        {perm.resource_name}
                      </span>
                      <Badge variant="info" className="shrink-0">{perm.resource_type}</Badge>
                      <Badge variant={perm.permission_level === 'write' ? 'warning' : 'success'} className="shrink-0">
                        {al?.label ?? perm.permission_level}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(perm.id)}
                      loading={deleting === perm.id}
                      className="shrink-0 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── Quick Create Group Modal ─────────────────────────────────────────────────

function QuickCreateGroupModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await adminService.createGroup({ name: name.trim(), description })
      toast.success(`Group "${name}" created`)
      onClose()
      setName('')
      setDescription('')
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Group"
      description="Add a new user group"
      footer={
        <>
          <Button variant="secondary" onClick={() => { onClose(); navigate('/groups') }}>
            Manage Groups
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={<Users size={16} />}>
            Create Group
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Group Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Data Team"
          autoFocus
        />
        <Input
          label="Description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </form>
    </Modal>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [permUser, setPermUser] = useState<User | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getUsers()
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return
    setDeleting(true)
    try {
      await adminService.deleteUser(deleteUser.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id))
      toast.success(`User "${deleteUser.username}" deleted`)
      setDeleteUser(null)
    } catch (err: unknown) {
      const e = err as { message?: string }
      toast.error(e?.message ?? 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => { loadUsers() }, [loadUsers])

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Users size={16} />} onClick={() => setShowCreateGroup(true)}>
            Add Group
          </Button>
          <Button icon={<UserPlus size={16} />} onClick={() => setShowCreate(true)}>
            Add User
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={28} className="text-[var(--text-muted)]" /></div>
          <p className="text-sm text-[var(--text-muted)]">No users found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Export</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shrink-0">
                        {getInitials(u.username)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{u.username}</p>
                        <p className="text-xs text-[var(--text-muted)]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={u.role} /></td>
                  <td><StatusBadge active={u.is_active !== false} /></td>
                  <td>
                    {u.can_export ? (
                      <Badge variant="success" dot>Enabled</Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )}
                  </td>
                  <td className="text-sm text-[var(--text-muted)]">
                    {formatRelativeTime(u.last_login)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        icon={<Key size={14} />}
                        onClick={() => setPermUser(u)}
                        title="Manage permissions"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        icon={<KeyRound size={14} />}
                        onClick={() => setResetUser(u)}
                        title="Reset password"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        icon={<Pencil size={14} />}
                        onClick={() => setEditUser(u)}
                        title="Edit user"
                      />
                      {u.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={<Trash2 size={14} />}
                          onClick={() => setDeleteUser(u)}
                          title="Delete user"
                          className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuickCreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
      <CreateUserModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(u) => setUsers((prev) => [u, ...prev])}
      />
      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onUpdated={(updated) =>
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        }
      />
      <PermissionsModal
        isOpen={!!permUser}
        onClose={() => setPermUser(null)}
        user={permUser}
      />
      <ResetPasswordModal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        user={resetUser}
      />
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUser?.username}"? This will also remove all their permissions. This action cannot be undone.`}
        confirmLabel="Delete User"
        loading={deleting}
      />
    </div>
  )
}

// ─── Multi-select Dropdown ────────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all min-w-[110px] justify-between ${
          selected.length > 0
            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'border-[var(--border-color)] text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span>{label}</span>
          {selected.length > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown size={13} className={`transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[180px] max-h-56 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--text-muted)]">No options</p>
          ) : (
            <div className="py-1">
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => { onChange([]); setOpen(false) }}
                  className="w-full px-3 py-1.5 text-left text-xs text-red-400 hover:bg-[var(--bg-secondary)] border-b border-[var(--border-color)]"
                >
                  Clear all
                </button>
              )}
              {options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-[var(--bg-secondary)] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.value)}
                    onChange={() => toggle(opt.value)}
                    className="rounded accent-primary-500"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── User Typeahead ───────────────────────────────────────────────────────────

function UserTypeahead({
  users,
  selected,
  onChange,
}: {
  users: User[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectedUsers = users.filter((u) => selected.includes(String(u.id)))
  const filteredOptions = users.filter(
    (u) =>
      !selected.includes(String(u.id)) &&
      (u.username.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase()))
  )

  const addUser = (userId: string) => {
    onChange([...selected, userId])
    setQuery('')
    inputRef.current?.focus()
  }

  const removeUser = (userId: string) => {
    onChange(selected.filter((s) => s !== userId))
  }

  return (
    <div className="relative min-w-[200px]" ref={ref}>
      <div
        className={`flex flex-wrap items-center gap-1 rounded-lg border px-2 py-1.5 min-h-[38px] bg-[var(--bg-primary)] cursor-text transition-colors ${
          open
            ? 'border-primary-500 ring-1 ring-primary-500/20'
            : 'border-[var(--border-color)]'
        }`}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        {selectedUsers.map((u) => (
          <span
            key={u.id}
            className="flex items-center gap-1 rounded-md bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300"
          >
            {u.username}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeUser(String(u.id)) }}
              className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selectedUsers.length === 0 ? 'Search users…' : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 max-h-56 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-[var(--text-muted)]">
              {query ? 'No users match' : selected.length === users.length ? 'All users selected' : 'Type to search'}
            </p>
          ) : (
            <div className="py-1">
              {filteredOptions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => addUser(String(u.id))}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                    {getInitials(u.username)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{u.username}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')

  // Filters
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [selectedResourceTypes, setSelectedResourceTypes] = useState<string[]>([])
  const [resourceName, setResourceName] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    Promise.all([adminService.getActivityLogs(), adminService.getUsers()])
      .then(([logsData, usersData]) => {
        setLogs(logsData)
        setUsers(usersData)
      })
      .catch(() => toast.error('Failed to load activity logs'))
      .finally(() => setLoading(false))
  }, [])

  const actionOptions = useMemo(
    () => [...new Set(logs.map((l) => l.action).filter(Boolean))].sort().map((a) => ({ value: a, label: a })),
    [logs]
  )
  const resourceTypeOptions = useMemo(
    () => [...new Set(logs.map((l) => l.resource_type).filter(Boolean))].sort().map((rt) => ({ value: rt, label: rt })),
    [logs]
  )

  const hasActiveFilters =
    selectedUsers.length > 0 ||
    selectedActions.length > 0 ||
    selectedResourceTypes.length > 0 ||
    resourceName !== '' ||
    dateFrom !== '' ||
    dateTo !== ''

  const clearFilters = () => {
    setSelectedUsers([])
    setSelectedActions([])
    setSelectedResourceTypes([])
    setResourceName('')
    setDateFrom('')
    setDateTo('')
  }

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (selectedUsers.length && !selectedUsers.includes(String(l.user_id))) return false
      if (selectedActions.length && !selectedActions.includes(l.action)) return false
      if (selectedResourceTypes.length && !selectedResourceTypes.includes(l.resource_type)) return false
      if (resourceName && !l.resource_name?.toLowerCase().includes(resourceName.toLowerCase())) return false
      if (dateFrom && l.timestamp < dateFrom) return false
      if (dateTo && l.timestamp > dateTo + 'T23:59:59') return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !l.action?.toLowerCase().includes(q) &&
          !l.resource_name?.toLowerCase().includes(q) &&
          !l.username?.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [logs, selectedUsers, selectedActions, selectedResourceTypes, resourceName, dateFrom, dateTo, search])

  const handleExport = async () => {
    setExporting(true)
    try {
      await adminService.exportActivityLogs({
        user_ids: selectedUsers.map(Number),
        actions: selectedActions,
        resource_types: selectedResourceTypes,
        resource_name: resourceName,
        date_from: dateFrom,
        date_to: dateTo,
      })
      toast.success(`Exported ${filtered.length} record${filtered.length !== 1 ? 's' : ''}`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search + Export */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="input pl-9"
          />
        </div>
        <Button
          icon={<FileDown size={16} />}
          onClick={handleExport}
          loading={exporting}
          disabled={loading}
          variant="secondary"
        >
          Export CSV
        </Button>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
        <Filter size={14} className="text-[var(--text-muted)] shrink-0" />
        <UserTypeahead
          users={users}
          selected={selectedUsers}
          onChange={setSelectedUsers}
        />
        <MultiSelect
          label="Actions"
          options={actionOptions}
          selected={selectedActions}
          onChange={setSelectedActions}
        />
        <MultiSelect
          label="Resource Type"
          options={resourceTypeOptions}
          selected={selectedResourceTypes}
          onChange={setSelectedResourceTypes}
        />
        <input
          type="text"
          value={resourceName}
          onChange={(e) => setResourceName(e.target.value)}
          placeholder="Resource name..."
          className="input text-sm py-2 min-w-[140px]"
        />
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-[var(--text-muted)] shrink-0" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input text-sm py-2"
            title="From date"
          />
          <span className="text-[var(--text-muted)] text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input text-sm py-2"
            title="To date"
          />
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-red-400 hover:text-red-500 transition-colors"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      {/* Results count when filters are active */}
      {hasActiveFilters && !loading && (
        <p className="text-xs text-[var(--text-muted)]">
          Showing {filtered.length} of {logs.length} records
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Activity size={28} className="text-[var(--text-muted)]" /></div>
          <p className="text-sm text-[var(--text-muted)]">No activity found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Time</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.username ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {getInitials(log.username)}
                        </div>
                        <span className="text-sm">{log.username}</span>
                      </div>
                    ) : (
                      <span className="text-[var(--text-muted)]">—</span>
                    )}
                  </td>
                  <td><Badge variant="default">{log.action}</Badge></td>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{log.resource_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{log.resource_type}</p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-sm">{formatRelativeTime(log.timestamp)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(log.timestamp)}</p>
                    </div>
                  </td>
                  <td><code className="text-xs font-mono">{log.ip_address || '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users')

  const tabs = [
    { id: 'users', label: 'Users', icon: <Users size={16} /> },
    { id: 'activity', label: 'Activity Log', icon: <Activity size={16} /> },
  ] as const

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={24} className="text-purple-500" />
            Admin Panel
          </h1>
          <p className="page-subtitle">Manage users, permissions, and system activity</p>
        </div>
      </div>

      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'activity' && <ActivityTab />}
      </Card>
    </div>
  )
}
