import React, { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Plus,
  Trash2,
  Pencil,
  UserPlus,
  Search,
  UserMinus,
  Key,
  Database,
  Table2,
  Columns,
  List,
  CheckSquare,
  Square,
} from 'lucide-react'
import { adminService } from '../services/admin'
import { catalogService } from '../services/catalog'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Input'
import { Modal, ConfirmDialog } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { ResourceAutocomplete } from '../components/ui/ResourceAutocomplete'
import { formatRelativeTime, getInitials } from '../utils/format'
import toast from 'react-hot-toast'
import type { Group, GroupMember, Permission, User, CreateGroupPayload, CreatePermissionPayload, Schema, Table } from '../types'

interface BulkItem {
  name: string
  level: 'read' | 'write'
  selected: boolean
}

const RESOURCE_TYPES = [
  { value: 'schema', label: 'Schema', icon: <Database size={14} /> },
  { value: 'table', label: 'Table', icon: <Table2 size={14} /> },
  { value: 'column', label: 'Column', icon: <Columns size={14} /> },
]

const ACCESS_LEVELS = [
  { value: 'read', label: 'View Only', description: 'Browse and search' },
  { value: 'write', label: 'Edit Access', description: 'Modify metadata' },
]

// Create/Edit Group Modal
function GroupFormModal({
  isOpen,
  onClose,
  group,
  onSaved,
}: {
  isOpen: boolean
  onClose: () => void
  group?: Group | null
  onSaved: (group: Group) => void
}) {
  const [form, setForm] = useState<CreateGroupPayload>({
    name: group?.name ?? '',
    description: group?.description ?? '',
  })
  const [errors, setErrors] = useState<Partial<CreateGroupPayload>>({})
  const [loading, setLoading] = useState(false)
  const isEditing = !!group

  useEffect(() => {
    if (isOpen) {
      setForm({ name: group?.name ?? '', description: group?.description ?? '' })
      setErrors({})
    }
  }, [isOpen, group])

  const validate = () => {
    const e: Partial<CreateGroupPayload> = {}
    if (!form.name.trim()) e.name = 'Group name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      let saved: Group
      if (isEditing && group) {
        saved = await adminService.updateGroup(group.id, form)
        toast.success('Group updated')
      } else {
        saved = await adminService.createGroup(form)
        toast.success(`Group "${saved.name}" created`)
      }
      onSaved(saved)
      onClose()
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to save group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Group' : 'Create Group'}
      description={isEditing ? 'Update group details' : 'Create a new user group'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading} icon={isEditing ? <Pencil size={16} /> : <Plus size={16} />}>
            {isEditing ? 'Save Changes' : 'Create Group'}
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Group Name"
          name="name"
          value={form.name}
          onChange={(e) => {
            setForm((f) => ({ ...f, name: e.target.value }))
            setErrors((er) => ({ ...er, name: undefined }))
          }}
          error={errors.name}
          placeholder="e.g. Data Analysts"
          autoFocus
        />
        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Optional group description"
          rows={3}
        />
      </form>
    </Modal>
  )
}

// Members Modal
function MembersModal({
  isOpen,
  onClose,
  group,
  allUsers,
}: {
  isOpen: boolean
  onClose: () => void
  group: Group | null
  allUsers: User[]
}) {
  const [members, setMembers] = useState<GroupMember[]>([])
  const [loading, setLoading] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && group) {
      setLoading(true)
      adminService
        .getGroupMembers(group.id)
        .then(setMembers)
        .catch(() => toast.error('Failed to load members'))
        .finally(() => setLoading(false))
    }
  }, [isOpen, group])

  const memberIds = new Set(members.map((m) => m.id))
  const availableUsers = allUsers.filter((u) => !memberIds.has(u.id))

  const handleAdd = async () => {
    if (!group || !addUserId) {
      toast.error('Please select a user')
      return
    }
    setAdding(true)
    try {
      await adminService.addGroupMember(group.id, parseInt(addUserId))
      const user = allUsers.find((u) => u.id === parseInt(addUserId))
      if (user) {
        setMembers((prev) => [
          ...prev,
          { id: user.id, username: user.username, email: user.email, role: user.role },
        ])
      }
      setAddUserId('')
      toast.success('Member added')
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId: number) => {
    if (!group) return
    setRemoving(userId)
    try {
      await adminService.removeGroupMember(group.id, userId)
      setMembers((prev) => prev.filter((m) => m.id !== userId))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Members"
      description={group ? `Members of "${group.name}"` : ''}
      size="lg"
    >
      <div className="space-y-6">
        {/* Add member */}
        {availableUsers.length > 0 && (
          <div className="rounded-lg border border-[var(--border-color)] p-4 bg-[var(--bg-secondary)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Add Member</p>
            <div className="flex gap-3">
              <Select
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                options={availableUsers.map((u) => ({
                  value: String(u.id),
                  label: `${u.username} (${u.email})`,
                }))}
                placeholder="Select user..."
              />
              <Button
                icon={<UserPlus size={16} />}
                onClick={handleAdd}
                loading={adding}
                className="shrink-0"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Members list */}
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            Members ({members.length})
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="loading-spinner" />
            </div>
          ) : members.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-4">
              No members yet
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                      {getInitials(member.username)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">{member.username}</p>
                      <p className="text-xs text-[var(--text-muted)]">{member.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={<UserMinus size={14} />}
                    onClick={() => handleRemove(member.id)}
                    loading={removing === member.id}
                    className="text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove member"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

// Group Permissions Modal
function GroupPermissionsModal({
  isOpen,
  onClose,
  group,
}: {
  isOpen: boolean
  onClose: () => void
  group: Group | null
}) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [newPerm, setNewPerm] = useState<CreatePermissionPayload>({
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

  useEffect(() => {
    if (isOpen && group) {
      setLoading(true)
      adminService
        .getGroupPermissions(group.id)
        .then(setPermissions)
        .catch(() => toast.error('Failed to load permissions'))
        .finally(() => setLoading(false))
    } else {
      setPermissions([])
      setBulkMode(false)
      setBulkItems([])
    }
  }, [isOpen, group])

  // Load schemas for bulk table/column selectors
  useEffect(() => {
    if (bulkMode && (newPerm.resource_type === 'table' || newPerm.resource_type === 'column')) {
      catalogService.getSchemas().then(setBulkSchemas).catch(() => {})
    }
  }, [bulkMode, newPerm.resource_type])

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
    if (!group) return
    const toGrant = bulkItems.filter((i) => i.selected)
    if (toGrant.length === 0) { toast.error('No resources selected'); return }
    setAdding(true)
    let successCount = 0
    for (const item of toGrant) {
      try {
        const perm = await adminService.addGroupPermission(group.id, {
          resource_type: newPerm.resource_type,
          resource_name: item.name,
          permission_level: item.level,
        })
        setPermissions((prev) => [...prev, perm])
        successCount++
      } catch { /* skip duplicates */ }
    }
    toast.success(`Granted ${successCount} permission${successCount !== 1 ? 's' : ''}`)
    setBulkItems([])
    setBulkMode(false)
    setAdding(false)
  }

  const handleAdd = async () => {
    if (!group || !newPerm.resource_name.trim()) {
      toast.error('Please select or enter a resource name')
      return
    }
    setAdding(true)
    try {
      const perm = await adminService.addGroupPermission(group.id, newPerm)
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
    if (!group) return
    setDeleting(permId)
    try {
      await adminService.deleteGroupPermission(group.id, permId)
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
      title="Group Permissions"
      description={group ? `Resource access for "${group.name}"` : ''}
      size="lg"
    >
      <div className="space-y-6">
        {/* ── Grant new permission ── */}
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

          {/* Resource type */}
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

              {/* Default access level */}
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

// Group card
function GroupCard({
  group,
  onEdit,
  onMembers,
  onPermissions,
  onDelete,
}: {
  group: Group
  onEdit: () => void
  onMembers: () => void
  onPermissions: () => void
  onDelete: () => void
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{group.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">
              Created {formatRelativeTime(group.created_at)}
            </p>
          </div>
        </div>
        <Badge variant="default">
          <Users size={11} />
          {group.member_count} members
        </Badge>
      </div>

      {group.description && (
        <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
          {group.description}
        </p>
      )}

      <div className="divider mb-4" />

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          icon={<Users size={13} />}
          onClick={onMembers}
        >
          Members
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Key size={13} />}
          onClick={onPermissions}
        >
          Permissions
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Pencil size={13} />}
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Trash2 size={13} />}
          onClick={onDelete}
          className="ml-auto text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Delete
        </Button>
      </div>
    </div>
  )
}

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [membersGroup, setMembersGroup] = useState<Group | null>(null)
  const [permGroup, setPermGroup] = useState<Group | null>(null)
  const [deleteGroup, setDeleteGroup] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [groupsData, usersData] = await Promise.all([
        adminService.getGroups(),
        adminService.getUsers(),
      ])
      setGroups(groupsData)
      setAllUsers(usersData)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDeleteConfirm = async () => {
    if (!deleteGroup) return
    setDeleting(true)
    try {
      await adminService.deleteGroup(deleteGroup.id)
      setGroups((prev) => prev.filter((g) => g.id !== deleteGroup.id))
      toast.success(`Group "${deleteGroup.name}" deleted`)
      setDeleteGroup(null)
    } catch {
      toast.error('Failed to delete group')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={24} className="text-primary-500" />
            Groups
          </h1>
          <p className="page-subtitle">Manage user groups and their permissions</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>
          New Group
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="input pl-9"
        />
      </div>

      {/* Groups grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={32} className="text-[var(--text-muted)]" />
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
            No groups found
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {search ? 'Try a different search term' : 'Create your first group to get started'}
          </p>
          {!search && (
            <Button
              className="mt-4"
              icon={<Plus size={16} />}
              onClick={() => setShowCreate(true)}
            >
              Create Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEdit={() => setEditGroup(group)}
              onMembers={() => setMembersGroup(group)}
              onPermissions={() => setPermGroup(group)}
              onDelete={() => setDeleteGroup(group)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <GroupFormModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={(g) => setGroups((prev) => [g, ...prev])}
      />
      <GroupFormModal
        isOpen={!!editGroup}
        onClose={() => setEditGroup(null)}
        group={editGroup}
        onSaved={(updated) =>
          setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
        }
      />
      <MembersModal
        isOpen={!!membersGroup}
        onClose={() => setMembersGroup(null)}
        group={membersGroup}
        allUsers={allUsers}
      />
      <GroupPermissionsModal
        isOpen={!!permGroup}
        onClose={() => setPermGroup(null)}
        group={permGroup}
      />
      <ConfirmDialog
        isOpen={!!deleteGroup}
        onClose={() => setDeleteGroup(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteGroup?.name}"? This action cannot be undone and all associated permissions will be removed.`}
        confirmLabel="Delete Group"
        loading={deleting}
      />
    </div>
  )
}
