import React, { useState, useEffect, useCallback } from 'react'
import {
  FolderOpen,
  FileText,
  RefreshCw,
  Pencil,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Database,
} from 'lucide-react'
import { adminService } from '../services/admin'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'
import type { FilesConfig } from '../types'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatModified(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function Files() {
  const [config, setConfig] = useState<FilesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingDir, setEditingDir] = useState(false)
  const [dirDraft, setDirDraft] = useState('')
  const [savingDir, setSavingDir] = useState(false)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminService.getFiles()
      setConfig(data)
      setDirDraft(data.directory)
    } catch {
      toast.error('Failed to load file directory')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleSaveDir = async () => {
    if (!dirDraft.trim()) return
    setSavingDir(true)
    try {
      const result = await adminService.setFilesDirectory(dirDraft.trim())
      setConfig((prev) => prev ? { ...prev, directory: result.directory } : prev)
      setEditingDir(false)
      toast.success(result.message)
      // Reload file list after directory change
      await loadFiles()
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error?.message ?? 'Failed to change directory')
    } finally {
      setSavingDir(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary-500" />
          <p className="text-sm text-[var(--text-muted)]">Loading file directory…</p>
        </div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FolderOpen size={22} className="text-amber-500" />
            File Directory
          </h1>
          <p className="page-subtitle">Manage the YAML schema files used to populate the data catalog</p>
        </div>
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={loadFiles}>
          Refresh
        </Button>
      </div>

      {/* Directory config */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
              YAML Directory
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-3">
              The folder containing <code className="font-mono text-xs">.yml</code> / <code className="font-mono text-xs">.yaml</code> schema files.
            </p>

            {editingDir ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={dirDraft}
                  onChange={(e) => setDirDraft(e.target.value)}
                  placeholder="/path/to/yaml/directory"
                  className="input flex-1 font-mono text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveDir()
                    if (e.key === 'Escape') setEditingDir(false)
                  }}
                />
                <button
                  onClick={handleSaveDir}
                  disabled={savingDir}
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {savingDir ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => { setEditingDir(false); setDirDraft(config.directory) }}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 flex-1 ${config.exists ? 'border-[var(--border-color)] bg-[var(--bg-secondary)]' : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}>
                  {config.exists ? (
                    <FolderOpen size={15} className="text-amber-500 shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="text-red-500 shrink-0" />
                  )}
                  <code className="font-mono text-sm text-[var(--text-primary)] truncate">
                    {config.directory}
                  </code>
                  {!config.exists && (
                    <span className="ml-auto text-xs text-red-500 shrink-0">Not found</span>
                  )}
                </div>
                <button
                  onClick={() => setEditingDir(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-primary-500"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {!config.exists && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-900/20 p-3 flex items-start gap-2">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">
              The configured directory does not exist. Click the edit button above to set a valid path.
            </p>
          </div>
        )}
      </Card>

      {/* Files list */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={15} className="text-[var(--text-muted)]" />
            YAML Files ({config.files.length})
          </h2>
        </div>

        {config.files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderOpen size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {config.exists
                ? 'No .yml or .yaml files found in this directory'
                : 'Directory does not exist'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Schema</th>
                  <th>Tables</th>
                  <th>Size</th>
                  <th>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {config.files.map((file) => (
                  <tr key={file.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[var(--text-muted)] shrink-0" />
                        <span className="font-mono text-sm text-[var(--text-primary)]">{file.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Database size={13} className="text-[var(--text-muted)]" />
                        <span className="font-mono text-sm text-[var(--text-secondary)]">
                          {file.schema_name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-mono text-[var(--text-secondary)]">
                        {file.table_count}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-[var(--text-muted)]">{formatBytes(file.size)}</span>
                    </td>
                    <td>
                      <span className="text-sm text-[var(--text-muted)]">{formatModified(file.modified)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
