import api from './api'
import type { Schema, Table, SearchResult, Stats, ExportFormat } from '../types'

export const catalogService = {
  async getStats(): Promise<Stats> {
    const response = await api.get<Stats>('/api/stats')
    return response.data
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
    const response = await api.get<{ results: SearchResult[] }>(`/api/search?${params.toString()}`)
    return response.data
  },

  async getSchemas(): Promise<Schema[]> {
    const response = await api.get<Schema[]>('/api/schemas')
    return response.data
  },

  async getSchemaTables(schemaName: string): Promise<Table[]> {
    const response = await api.get<Table[]>(`/api/schemas/${encodeURIComponent(schemaName)}/tables`)
    return response.data
  },

  async getTableDetail(schemaName: string, tableName: string): Promise<Table> {
    const response = await api.get<Table>(
      `/api/schemas/${encodeURIComponent(schemaName)}/tables/${encodeURIComponent(tableName)}`
    )
    return response.data
  },

  // Export
  async getExportFormats(): Promise<ExportFormat[]> {
    const response = await api.get<ExportFormat[]>('/api/export/formats')
    return response.data
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
    return response.data
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
