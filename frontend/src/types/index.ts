export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'contributor' | 'viewer'
  can_export: boolean
  created_at?: string
  last_login?: string
  is_active?: boolean
}

export interface Schema {
  name: string
  table_count: number
}

export interface Column {
  name: string
  data_type: string
  description: string
  nullable?: boolean
  default_value?: string
  is_primary_key?: boolean
  is_foreign_key?: boolean
}

export interface Table {
  name: string
  schema: string
  description: string
  columns: Column[]
  row_count?: number
  created_at?: string
  updated_at?: string
}

export interface SearchResult {
  type: 'schema' | 'table' | 'column'
  schema: string
  table?: string
  name: string
  description: string
}

export interface Stats {
  total_databases: number
  total_tables: number
  total_columns: number
}

export interface Group {
  id: number
  name: string
  description: string
  created_at: string
  member_count: number
}

export interface GroupMember {
  id: number
  username: string
  email: string
  role: string
  joined_at?: string
}

export interface Permission {
  id: number
  resource_type: string
  resource_name: string
  permission_level: string
  created_at?: string
}

export interface ActivityLog {
  id: number
  action: string
  resource_type: string
  resource_name: string
  timestamp: string
  ip_address: string
  user_id?: number
  username?: string
  details?: string
}

export interface ExportFormat {
  id: string
  name: string
  extension: string
  mime_type: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface SignupCredentials {
  username: string
  email: string
  password: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role: User['role']
}

export interface UpdateUserPayload {
  role?: User['role']
  can_export?: boolean
  is_active?: boolean
}

export interface CreateGroupPayload {
  name: string
  description: string
}

export interface CreatePermissionPayload {
  resource_type: string
  resource_name: string
  permission_level: string
}

export type ThemeMode = 'light' | 'dark'

export interface AnalyticsTable {
  name: string
  column_count: number
  description: string
}

export interface AnalyticsSchema {
  name: string
  table_count: number
  column_count: number
  tables: AnalyticsTable[]
}

export interface AnalyticsData {
  schemas: AnalyticsSchema[]
  data_types: Record<string, number>
  totals: { schemas: number; tables: number; columns: number }
}

export interface FileInfo {
  name: string
  schema_name: string
  size: number
  modified: string
  table_count: number
}

export interface FilesConfig {
  directory: string
  exists: boolean
  files: FileInfo[]
}
