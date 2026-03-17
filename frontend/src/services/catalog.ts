import api from './api'
import type { Schema, Table, SearchResult, Stats, ExportFormat, Permission, AnalyticsData } from '../types'

export const catalogService = {
  async getStats(): Promise<Stats> {
    const response = await api.get<{ schemas: number; tables: number; columns: number }>(
      '/api/stats'
    )
    // Backend returns { schemas, tables, columns } — map to our Stats type
    return {
      total_databases: response.data.schemas,
      total_tables: response.data.tables,
      total_columns: response.data.columns,
    }
  },

  async search(
    query: string,
    schema?: string,
    type?: string
  ): Promise<{ results: SearchResult[] }> {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (schema) params.set('schema', schema)
    if (type) params.set('type', type)
    const response = await api.get<{ results: SearchResult[]; count: number; query: string }>(
      `/api/search?${params.toString()}`
    )
    return { results: response.data.results ?? [] }
  },

  async getSchemas(): Promise<Schema[]> {
    // Backend returns { schemas: [...] }
    const response = await api.get<{ schemas: Schema[] }>('/api/schemas')
    return response.data.schemas ?? []
  },

  async getSchemaTables(schemaName: string): Promise<Table[]> {
    // Backend returns { schema, tables: [...] }
    const response = await api.get<{ schema: string; tables: Table[] }>(
      `/api/schemas/${encodeURIComponent(schemaName)}/tables`
    )
    return response.data.tables ?? []
  },

  async getTableDetail(schemaName: string, tableName: string): Promise<Table> {
    // Backend returns the table object directly
    const response = await api.get<Table>(
      `/api/schemas/${encodeURIComponent(schemaName)}/tables/${encodeURIComponent(tableName)}`
    )
    return response.data
  },

  // Export
  async getExportFormats(): Promise<ExportFormat[]> {
    // Backend returns a raw array: [{ name, label, extension }]
    // 'name' is the format identifier; 'label' is the human-readable display name.
    const response = await api.get<Array<{ name: string; label: string; extension: string }>>(
      '/api/export/formats'
    )
    const raw = Array.isArray(response.data) ? response.data : []
    return raw.map((f) => ({
      id: f.name,          // used as the POST format key
      name: f.label,       // display label in the UI
      extension: f.extension,
      mime_type: '',
    }))
  },

  async checkExportPermission(): Promise<{ can_export: boolean }> {
    const response = await api.get<{ can_export: boolean }>('/api/export/check-permission')
    return response.data
  },

  async exportData(
    format: string,
    payload: { schema?: string; table?: string; columns?: string[] }
  ): Promise<Blob> {
    const response = await api.post(`/api/export/${format}`, payload, {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  async getMyPermissions(): Promise<{ permissions: Permission[]; is_admin: boolean }> {
    const res = await api.get<{ permissions: Permission[]; is_admin: boolean }>('/api/me/permissions')
    return res.data
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await api.get<AnalyticsData>('/api/analytics')
    return res.data
  },

  async updateTableDescription(schema: string, table: string, description: string): Promise<void> {
    await api.patch(
      `/api/schemas/${encodeURIComponent(schema)}/tables/${encodeURIComponent(table)}`,
      { description }
    )
  },

  async updateColumnDescription(
    schema: string,
    table: string,
    column: string,
    description: string
  ): Promise<void> {
    await api.patch(
      `/api/schemas/${encodeURIComponent(schema)}/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}`,
      { description }
    )
  },

  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  },
}
