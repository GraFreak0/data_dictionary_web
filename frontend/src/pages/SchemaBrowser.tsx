import React, { useState, useEffect, useCallback } from 'react'
import {
  Database,
  Table2,
  Columns,
  ChevronRight,
  ChevronDown,
  Loader2,
  Key,
  Link,
  Pencil,
  Check,
  X,
  Download,
} from 'lucide-react'
import { catalogService } from '../services/catalog'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Badge, TypeBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { cn } from '../utils/cn'
import toast from 'react-hot-toast'
import type { Schema, Table, Column, Permission, ExportFormat } from '../types'

// ── Permissions helper ────────────────────────────────────────────────────────

function useEditPermissions() {
  const { user } = useAuthStore()
  const [myPermissions, setMyPermissions] = useState<Permission[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin') {
      setIsAdmin(true)
      return
    }
    catalogService
      .getMyPermissions()
      .then((res) => {
        setMyPermissions(res.permissions)
        setIsAdmin(res.is_admin)
      })
      .catch(() => {})
  }, [user])

  const canEdit = useCallback(
    (schemaName: string, tableName?: string) => {
      if (isAdmin) return true
      return myPermissions.some(
        (p) =>
          p.permission_level === 'write' &&
          (p.resource_name === schemaName ||
            (tableName && p.resource_name === tableName) ||
            (tableName && p.resource_name === `${schemaName}.${tableName}`))
      )
    },
    [isAdmin, myPermissions]
  )

  return { canEdit }
}

// ── Inline editable text ──────────────────────────────────────────────────────

function EditableText({
  value,
  onSave,
  placeholder = 'No description',
  multiline = false,
}: {
  value: string
  onSave: (newValue: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(draft)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="input flex-1 text-sm resize-none"
            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <input
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="input flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setEditing(false)
            }}
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <span className={value ? 'text-[var(--text-secondary)]' : 'italic text-[var(--text-muted)] opacity-50'}>
        {value || placeholder}
      </span>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="shrink-0 opacity-0 group-hover:opacity-70 hover:!opacity-100 flex h-5 w-5 items-center justify-center rounded text-[var(--text-muted)] hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
      >
        <Pencil size={11} />
      </button>
    </div>
  )
}

// ── Schema tree item ──────────────────────────────────────────────────────────

function SchemaItem({
  schema,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  children,
}: {
  schema: Schema
  isExpanded: boolean
  isSelected: boolean
  onToggle: () => void
  onSelect: () => void
  children?: React.ReactNode
}) {
  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer group transition-colors',
          isSelected
            ? 'bg-primary-600/10 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
            : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
        )}
        onClick={onToggle}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle() }}
          className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <Database size={14} className="shrink-0 opacity-70" />
        <button
          className="flex-1 text-left text-sm font-medium truncate"
          onClick={(e) => { e.stopPropagation(); onSelect() }}
        >
          {schema.name}
        </button>
        <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] rounded px-1.5 py-0.5 shrink-0">
          {schema.table_count}
        </span>
      </div>
      {isExpanded && (
        <div className="ml-4 border-l border-[var(--border-color)] pl-2">{children}</div>
      )}
    </div>
  )
}

function TableItem({
  name,
  isSelected,
  onSelect,
}: {
  name: string
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
        isSelected
          ? 'bg-primary-600/10 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
      )}
    >
      <Table2 size={13} className="shrink-0 opacity-60" />
      <span className="truncate font-mono text-xs">{name}</span>
    </button>
  )
}

// ── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({
  isOpen,
  onClose,
  formats,
  selectedSchema,
  selectedTable,
}: {
  isOpen: boolean
  onClose: () => void
  formats: ExportFormat[]
  selectedSchema?: string
  selectedTable?: string
}) {
  const [format, setFormat] = useState('')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!format) { toast.error('Please select an export format'); return }
    setLoading(true)
    try {
      const blob = await catalogService.exportData(format, {
        schema: selectedSchema,
        table: selectedTable,
      })
      const ext = formats.find((f) => f.id === format)?.extension ?? format
      const filename = selectedTable
        ? `${selectedSchema}_${selectedTable}.${ext}`
        : selectedSchema
        ? `${selectedSchema}.${ext}`
        : `data_dictionary.${ext}`
      catalogService.downloadBlob(blob, filename)
      toast.success('Export started!')
      onClose()
    } catch {
      toast.error('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Data"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleExport} loading={loading} icon={<Download size={16} />}>Export</Button>
        </>
      }
    >
      <Select
        label="Format"
        value={format}
        onChange={(e) => setFormat(e.target.value)}
        options={formats.map((f) => ({ value: f.id, label: f.name }))}
        placeholder="Select format..."
      />
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function SchemaBrowser() {
  const { user } = useAuthStore()
  const { canEdit } = useEditPermissions()

  const [schemas, setSchemas] = useState<Schema[]>([])
  const [schemasLoading, setSchemasLoading] = useState(true)
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set())
  const [schemaTables, setSchemaTables] = useState<Record<string, Table[]>>({})
  const [tablesLoading, setTablesLoading] = useState<Record<string, boolean>>({})
  const [selectedSchema, setSelectedSchema] = useState<string | undefined>()
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [tableLoading, setTableLoading] = useState(false)

  // Export
  const [showExport, setShowExport] = useState(false)
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([])

  useEffect(() => {
    catalogService
      .getSchemas()
      .then(setSchemas)
      .catch(() => toast.error('Failed to load schemas'))
      .finally(() => setSchemasLoading(false))
  }, [])

  useEffect(() => {
    if (user?.can_export) {
      catalogService.getExportFormats().then(setExportFormats).catch(() => {})
    }
  }, [user])

  const toggleSchema = useCallback(
    async (schemaName: string) => {
      setExpandedSchemas((prev) => {
        const next = new Set(prev)
        next.has(schemaName) ? next.delete(schemaName) : next.add(schemaName)
        return next
      })
      if (!schemaTables[schemaName]) {
        setTablesLoading((prev) => ({ ...prev, [schemaName]: true }))
        try {
          const tables = await catalogService.getSchemaTables(schemaName)
          setSchemaTables((prev) => ({ ...prev, [schemaName]: tables }))
        } catch {
          toast.error(`Failed to load tables for ${schemaName}`)
        } finally {
          setTablesLoading((prev) => ({ ...prev, [schemaName]: false }))
        }
      }
    },
    [schemaTables]
  )

  const selectTable = useCallback(async (schemaName: string, tableName: string) => {
    setSelectedSchema(schemaName)
    setTableLoading(true)
    setSelectedTable(null)
    try {
      const table = await catalogService.getTableDetail(schemaName, tableName)
      setSelectedTable(table)
    } catch {
      toast.error('Failed to load table details')
    } finally {
      setTableLoading(false)
    }
  }, [])

  const handleUpdateTableDescription = async (description: string) => {
    if (!selectedTable) return
    await catalogService.updateTableDescription(selectedTable.schema, selectedTable.name, description)
    setSelectedTable((prev) => prev ? { ...prev, description } : prev)
    toast.success('Description updated')
  }

  const handleUpdateColumnDescription = async (col: Column, description: string) => {
    if (!selectedTable) return
    await catalogService.updateColumnDescription(selectedTable.schema, selectedTable.name, col.name, description)
    setSelectedTable((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        columns: prev.columns.map((c) =>
          c.name === col.name ? { ...c, description } : c
        ),
      }
    })
    toast.success('Column description updated')
  }

  const editableTable = selectedTable && canEdit(selectedTable.schema, selectedTable.name)

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Database size={22} className="text-primary-500" />
            Schema Browser
          </h1>
          <p className="page-subtitle">
            Browse schemas, tables, and columns
            {editableTable && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Pencil size={10} />
                Edit mode enabled
              </span>
            )}
          </p>
        </div>
        {user?.can_export && (
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => setShowExport(true)}>
            Export
          </Button>
        )}
      </div>

      {/* Main browser area */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '500px' }}>
        {/* Schema tree */}
        <div className="w-64 shrink-0 card p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Database size={15} />
              Schemas
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {schemasLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
              </div>
            ) : schemas.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-muted)]">No schemas found</div>
            ) : (
              schemas.map((schema) => (
                <SchemaItem
                  key={schema.name}
                  schema={schema}
                  isExpanded={expandedSchemas.has(schema.name)}
                  isSelected={selectedSchema === schema.name && !selectedTable}
                  onToggle={() => toggleSchema(schema.name)}
                  onSelect={() => {
                    setSelectedSchema(schema.name)
                    setSelectedTable(null)
                  }}
                >
                  {tablesLoading[schema.name] ? (
                    <div className="flex items-center gap-2 px-2 py-2 text-xs text-[var(--text-muted)]">
                      <Loader2 size={12} className="animate-spin" />
                      Loading...
                    </div>
                  ) : (
                    (schemaTables[schema.name] ?? []).map((table) => (
                      <TableItem
                        key={table.name}
                        name={table.name}
                        isSelected={selectedTable?.name === table.name && selectedTable?.schema === schema.name}
                        onSelect={() => selectTable(schema.name, table.name)}
                      />
                    ))
                  )}
                </SchemaItem>
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 card p-0 overflow-hidden flex flex-col min-w-0">
          {tableLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-primary-500" />
                <p className="text-sm text-[var(--text-muted)]">Loading table...</p>
              </div>
            </div>
          ) : selectedTable ? (
            <>
              {/* Table header */}
              <div className="border-b border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs text-[var(--text-muted)] font-mono">{selectedTable.schema}</span>
                      <ChevronRight size={14} className="text-[var(--text-muted)]" />
                      <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono">
                        {selectedTable.name}
                      </h2>
                    </div>
                    <div className="text-sm">
                      {editableTable ? (
                        <EditableText
                          value={selectedTable.description}
                          onSave={handleUpdateTableDescription}
                          placeholder="No description — click to add"
                          multiline
                        />
                      ) : (
                        <span className={selectedTable.description ? 'text-[var(--text-secondary)]' : 'italic text-[var(--text-muted)] opacity-50'}>
                          {selectedTable.description || 'No description available'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="info" className="text-xs">
                      {selectedTable.columns?.length ?? 0} columns
                    </Badge>
                    {user?.can_export && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Download size={14} />}
                        onClick={() => setShowExport(true)}
                      >
                        Export
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Columns table */}
              <div className="flex-1 overflow-auto">
                {selectedTable.columns && selectedTable.columns.length > 0 ? (
                  <table className="data-table w-full">
                    <thead className="sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                          Column Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                          Data Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                          Nullable
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.columns.map((col, i) => (
                        <tr key={i}>
                          <td className="border-t border-[var(--border-color)] px-4 py-3">
                            <div className="flex items-center gap-2">
                              {col.is_primary_key && (
                                <Key size={12} className="text-amber-500 shrink-0" aria-label="Primary Key" />
                              )}
                              {col.is_foreign_key && (
                                <Link size={12} className="text-blue-500 shrink-0" aria-label="Foreign Key" />
                              )}
                              <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                                {col.name}
                              </span>
                            </div>
                          </td>
                          <td className="border-t border-[var(--border-color)] px-4 py-3">
                            <code className="rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--text-secondary)] font-mono">
                              {col.data_type}
                            </code>
                          </td>
                          <td className="border-t border-[var(--border-color)] px-4 py-3">
                            {col.nullable !== undefined && (
                              <Badge variant={col.nullable ? 'warning' : 'success'} className="text-xs">
                                {col.nullable ? 'NULL' : 'NOT NULL'}
                              </Badge>
                            )}
                          </td>
                          <td className="border-t border-[var(--border-color)] px-4 py-3 text-sm text-[var(--text-muted)] max-w-sm">
                            {editableTable ? (
                              <EditableText
                                value={col.description}
                                onSave={(desc) => handleUpdateColumnDescription(col, desc)}
                                placeholder="Add description…"
                              />
                            ) : (
                              col.description || (
                                <span className="italic opacity-40">No description</span>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <Columns size={28} className="text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[var(--text-muted)] text-sm">No columns found</p>
                  </div>
                )}
              </div>
            </>
          ) : selectedSchema ? (
            // Schema overview — list of tables
            <div className="flex flex-col h-full">
              <div className="border-b border-[var(--border-color)] px-6 py-4 bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-primary-500" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono">
                    {selectedSchema}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {schemaTables[selectedSchema]?.length ?? 0} tables
                </p>
              </div>
              <div className="flex-1 overflow-auto p-6">
                {tablesLoading[selectedSchema] ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(schemaTables[selectedSchema] ?? []).map((table) => (
                      <button
                        key={table.name}
                        onClick={() => selectTable(selectedSchema, table.name)}
                        className="flex items-start gap-3 rounded-lg border border-[var(--border-color)] p-4 text-left transition-all hover:border-primary-300 hover:shadow-elevated dark:hover:border-primary-700"
                      >
                        <Table2 size={16} className="shrink-0 mt-0.5 text-[var(--text-muted)]" />
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-medium text-[var(--text-primary)] truncate">
                            {table.name}
                          </p>
                          {table.description && (
                            <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">
                              {table.description}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Database size={32} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                Select a schema
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)] max-w-xs text-center">
                Click a schema in the left panel to browse its tables and columns.
              </p>
            </div>
          )}
        </div>
      </div>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        formats={exportFormats}
        selectedSchema={selectedTable?.schema ?? selectedSchema}
        selectedTable={selectedTable?.name}
      />
    </div>
  )
}
