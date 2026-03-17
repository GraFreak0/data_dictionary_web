import React, { useState, useEffect } from 'react'
import { Database, Table2, Columns, BarChart2, TrendingUp, Loader2 } from 'lucide-react'
import { catalogService } from '../services/catalog'
import { useAuthStore } from '../store/authStore'
import { StatCard, Card } from '../components/ui/Card'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { AnalyticsData } from '../types'

// ── Simple bar chart (no external deps) ──────────────────────────────────────

function BarChart({
  data,
  colorClass = 'bg-primary-500',
}: {
  data: Array<{ label: string; value: number }>
  colorClass?: string
}) {
  if (data.length === 0) return <p className="text-sm text-[var(--text-muted)] py-2">No data</p>
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-28 text-right text-xs text-[var(--text-muted)] truncate shrink-0 font-mono">
            {item.label}
          </div>
          <div className="flex-1 h-5 bg-[var(--bg-tertiary)] rounded overflow-hidden">
            <div
              className={`h-full ${colorClass} rounded transition-all duration-700 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            >
              {item.value > max * 0.3 && (
                <span className="text-[10px] font-bold text-white/90">{item.value}</span>
              )}
            </div>
          </div>
          {item.value <= max * 0.3 && (
            <span className="text-xs font-mono text-[var(--text-muted)] w-6 shrink-0">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Data type distribution ────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  integer:  'bg-blue-500',
  string:   'bg-emerald-500',
  datetime: 'bg-purple-500',
  boolean:  'bg-amber-500',
  numeric:  'bg-rose-500',
}

function DataTypeChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <p className="text-sm text-[var(--text-muted)] py-2">No data</p>

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="h-5 rounded overflow-hidden flex">
        {entries.map(([type, count]) => (
          <div
            key={type}
            className={`h-full transition-all duration-700 ${TYPE_COLORS[type] ?? 'bg-slate-400'}`}
            style={{ width: `${(count / total) * 100}%` }}
            title={`${type}: ${count} (${Math.round((count / total) * 100)}%)`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
        {entries.slice(0, 8).map(([type, count]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-sm shrink-0 ${TYPE_COLORS[type] ?? 'bg-slate-400'}`} />
            <span className="text-xs text-[var(--text-secondary)] capitalize truncate">{type}</span>
            <span className="ml-auto text-xs font-mono text-[var(--text-muted)]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    catalogService
      .getAnalytics()
      .then(setAnalytics)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Welcome back, {user?.username}</h1>
        <p className="page-subtitle">Overview of your data catalog</p>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-[var(--bg-tertiary)]" />
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-[var(--bg-tertiary)]" />
                  <div className="h-6 w-16 rounded bg-[var(--bg-tertiary)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Schemas"
            value={analytics?.totals.schemas ?? 0}
            icon={<Database size={24} />}
            iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatCard
            label="Total Tables"
            value={analytics?.totals.tables ?? 0}
            icon={<Table2 size={24} />}
            iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatCard
            label="Total Columns"
            value={analytics?.totals.columns ?? 0}
            icon={<Columns size={24} />}
            iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          />
        </div>
      )}

      {!loading && analytics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Tables per schema */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Table2 size={15} className="text-primary-500" />
                Tables per Schema
              </h2>
              <button
                onClick={() => navigate('/schemas')}
                className="text-xs text-primary-500 hover:underline"
              >
                Browse →
              </button>
            </div>
            <BarChart
              data={analytics.schemas.map((s) => ({ label: s.name, value: s.table_count }))}
              colorClass="bg-primary-500"
            />
          </Card>

          {/* Columns per schema */}
          <Card>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Columns size={15} className="text-emerald-500" />
                Columns per Schema
              </h2>
            </div>
            <BarChart
              data={analytics.schemas.map((s) => ({ label: s.name, value: s.column_count }))}
              colorClass="bg-emerald-500"
            />
          </Card>

          {/* Data type distribution */}
          <Card>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart2 size={15} className="text-purple-500" />
                Column Data Types
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Distribution across {analytics.totals.columns} columns
              </p>
            </div>
            <DataTypeChart data={analytics.data_types} />
          </Card>

          {/* Top tables by column count */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp size={15} className="text-rose-500" />
                Top Tables by Column Count
              </h2>
              <button
                onClick={() => navigate('/analytics')}
                className="text-xs text-primary-500 hover:underline"
              >
                Full Analytics →
              </button>
            </div>
            <BarChart
              data={analytics.schemas
                .flatMap((s) =>
                  s.tables.map((t) => ({ label: `${s.name}.${t.name}`, value: t.column_count }))
                )
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)}
              colorClass="bg-rose-500"
            />
          </Card>
        </div>
      )}
    </div>
  )
}
