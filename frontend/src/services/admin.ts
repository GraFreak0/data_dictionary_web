import api from './api'
import type {
  User,
  Group,
  GroupMember,
  Permission,
  ActivityLog,
  CreateUserPayload,
  UpdateUserPayload,
  CreateGroupPayload,
  CreatePermissionPayload,
} from '../types'

export const adminService = {
  // ── Users ────────────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    // Backend: { users: [...] }
    const res = await api.get<{ users: User[] }>('/api/admin/users')
    return res.data.users ?? []
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const res = await api.post<User>('/api/admin/users', payload)
    return res.data
  },

  async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
    // Backend now returns the full updated User object
    const res = await api.patch<User>(`/api/admin/users/${userId}`, payload)
    return res.data
  },

  async getUserPermissions(userId: number): Promise<Permission[]> {
    // Backend: { permissions: [...] }
    const res = await api.get<{ permissions: Permission[] }>(
      `/api/admin/users/${userId}/permissions`
    )
    return res.data.permissions ?? []
  },

  async addUserPermission(
    userId: number,
    payload: CreatePermissionPayload
  ): Promise<Permission> {
    // Backend now returns the full Permission object
    const res = await api.post<Permission>(
      `/api/admin/users/${userId}/permissions`,
      payload
    )
    return res.data
  },

  async deletePermission(permissionId: number): Promise<void> {
    await api.delete(`/api/admin/permissions/${permissionId}`)
  },

  // ── Activity ─────────────────────────────────────────────────────────────

  async getActivityLogs(): Promise<ActivityLog[]> {
    // Backend: { logs: [...] }
    const res = await api.get<{ logs: ActivityLog[] }>('/api/admin/activity')
    return res.data.logs ?? []
  },

  // ── Groups ────────────────────────────────────────────────────────────────

  async getGroups(): Promise<Group[]> {
    // Backend: { groups: [...] }
    const res = await api.get<{ groups: Group[] }>('/api/groups')
    return res.data.groups ?? []
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    // Backend now returns the full Group object
    const res = await api.post<Group>('/api/groups', payload)
    return res.data
  },

  async updateGroup(groupId: number, payload: Partial<CreateGroupPayload>): Promise<Group> {
    const res = await api.patch<Group>(`/api/groups/${groupId}`, payload)
    return res.data
  },

  async deleteGroup(groupId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}`)
  },

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    // Backend: { members: [...] }
    const res = await api.get<{ members: GroupMember[] }>(
      `/api/groups/${groupId}/members`
    )
    return res.data.members ?? []
  },

  async addGroupMember(groupId: number, userId: number): Promise<void> {
    await api.post(`/api/groups/${groupId}/members`, { user_id: userId })
  },

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}/members/${userId}`)
  },

  async getGroupPermissions(groupId: number): Promise<Permission[]> {
    // Backend: { permissions: [...] }
    const res = await api.get<{ permissions: Permission[] }>(
      `/api/groups/${groupId}/permissions`
    )
    return res.data.permissions ?? []
  },

  async addGroupPermission(
    groupId: number,
    payload: CreatePermissionPayload
  ): Promise<Permission> {
    // Backend now returns the full Permission object
    const res = await api.post<Permission>(
      `/api/groups/${groupId}/permissions`,
      payload
    )
    return res.data
  },

  async deleteGroupPermission(groupId: number, permissionId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}/permissions/${permissionId}`)
  },
}
