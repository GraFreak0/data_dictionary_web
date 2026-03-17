import React, { useState, useEffect } from 'react'
import {
  BarChart2,
  Database,
  Table2,
  Columns,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { catalogService } from '../services/catalog'
import { Card, StatCard } from '../components/ui/Card'
import toast from 'react-hot-toast'
import type { AnalyticsData } from '../types'

// ── Simple horizontal bar chart ───────────────────────────────────────────────

function BarChart({
  data,
  colorClass = 'bg-primary-500',
  maxLabelWidth = 'w-32',
}: {
  data: Array<{ label: string; value: number }>
  colorClass?: string
  maxLabelWidth?: string
}) {
  if (data.length === 0) return <p className="text-sm text-[var(--text-muted)] py-4">No data</p>
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className={`${maxLabelWidth} text-right text-xs text-[var(--text-muted)] truncate shrink-0`}>
            {item.label}
          </div>
          <div className="flex-1 h-6 bg-[var(--bg-tertiary)] rounded overflow-hidden">
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
  integer: 'bg-blue-500',
  string: 'bg-emerald-500',
  datetime: 'bg-purple-500',
  boolean: 'bg-amber-500',
  numeric: 'bg-rose-500',
}

function DataTypeChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, v]) => s + v, 0)
  if (total === 0) return <p className="text-sm text-[var(--text-muted)] py-4">No data</p>

  // Build segments for the stacked bar
  let offset = 0
  const segments = entries.map(([type, count]) => {
    const pct = (count / total) * 100
    const seg = { type, count, pct, offset }
    offset += pct
    return seg
  })

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="h-6 rounded overflow-hidden flex">
        {segments.map(({ type, pct }) => (
          <div
            key={type}
            className={`h-full transition-all duration-700 ${TYPE_COLORS[type] ?? 'bg-slate-400'}`}
            style={{ width: `${pct}%` }}
            title={`${type}: ${Math.round(pct)}%`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {entries.slice(0, 10).map(([type, count]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-sm shrink-0 ${TYPE_COLORS[type] ?? 'bg-slate-400'}`} />
            <span className="text-xs text-[var(--text-secondary)] capitalize truncate">{type}</span>
            <span className="ml-auto text-xs font-mono text-[var(--text-muted)]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    catalogService
      .getAnalytics()
      .then(setData)
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary-500" />
          <p className="text-sm text-[var(--text-muted)]">Loading analytics…</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const topTablesByColumns = data.schemas
    .flatMap((s) => s.tables.map((t) => ({ schema: s.name, name: t.name, column_count: t.column_count })))
    .sort((a, b) => b.column_count - a.column_count)
    .slice(0, 15)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title flex items-center gap-2">
          <BarChart2 size={22} className="text-primary-500" />
          Analytics
        </h1>
        <p className="page-subtitle">Data catalog statistics and visualizations</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Schemas"
          value={data.totals.schemas}
          icon={<Database size={24} />}
          iconColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Total Tables"
          value={data.totals.tables}
          icon={<Table2 size={24} />}
          iconColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          label="Total Columns"
          value={data.totals.columns}
          icon={<Columns size={24} />}
          iconColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tables per schema */}
        <Card>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Table2 size={15} className="text-primary-500" />
              Tables per Schema
            </h2>
          </div>
          <BarChart
            data={data.schemas.map((s) => ({ label: s.name, value: s.table_count }))}
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
            data={data.schemas.map((s) => ({ label: s.name, value: s.column_count }))}
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
              Distribution across {data.totals.columns} total columns
            </p>
          </div>
          <DataTypeChart data={data.data_types} />
        </Card>

        {/* Top tables by column count */}
        <Card>
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp size={15} className="text-rose-500" />
              Top Tables by Column Count
            </h2>
          </div>
          <BarChart
            data={topTablesByColumns.map((t) => ({ label: `${t.schema}.${t.name}`, value: t.column_count }))}
            colorClass="bg-rose-500"
            maxLabelWidth="w-48"
          />
        </Card>
      </div>

      {/* Per-schema detail table */}
      <Card>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Database size={15} className="text-blue-500" />
            Schema Summary
          </h2>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Schema</th>
                <th>Tables</th>
                <th>Columns</th>
                <th>Avg Columns/Table</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.schemas.map((schema) => {
                const avgCols =
                  schema.table_count > 0
                    ? Math.round(schema.column_count / schema.table_count)
                    : 0
                const described = schema.tables.filter((t) => t.description).length
                const coverage =
                  schema.table_count > 0
                    ? Math.round((described / schema.table_count) * 100)
                    : 0
                return (
                  <tr key={schema.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Database size={14} className="text-[var(--text-muted)]" />
                        <span className="font-mono text-sm font-medium text-[var(--text-primary)]">
                          {schema.name}
                        </span>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{schema.table_count}</td>
                    <td className="font-mono text-sm">{schema.column_count}</td>
                    <td className="font-mono text-sm">{avgCols}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[var(--bg-tertiary)] rounded overflow-hidden max-w-20">
                          <div
                            className={`h-full rounded ${coverage >= 80 ? 'bg-emerald-500' : coverage >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{coverage}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
