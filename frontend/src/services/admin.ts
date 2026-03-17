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
  // Users
  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/api/admin/users')
    return response.data
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const response = await api.post<User>('/api/admin/users', payload)
    return response.data
  },

  async updateUser(userId: number, payload: UpdateUserPayload): Promise<User> {
    const response = await api.patch<User>(`/api/admin/users/${userId}`, payload)
    return response.data
  },

  async getUserPermissions(userId: number): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`/api/admin/users/${userId}/permissions`)
    return response.data
  },

  async addUserPermission(
    userId: number,
    payload: CreatePermissionPayload
  ): Promise<Permission> {
    const response = await api.post<Permission>(
      `/api/admin/users/${userId}/permissions`,
      payload
    )
    return response.data
  },

  async deletePermission(permissionId: number): Promise<void> {
    await api.delete(`/api/admin/permissions/${permissionId}`)
  },

  // Activity logs
  async getActivityLogs(): Promise<ActivityLog[]> {
    const response = await api.get<ActivityLog[]>('/api/admin/activity')
    return response.data
  },

  // Groups
  async getGroups(): Promise<Group[]> {
    const response = await api.get<Group[]>('/api/groups')
    return response.data
  },

  async createGroup(payload: CreateGroupPayload): Promise<Group> {
    const response = await api.post<Group>('/api/groups', payload)
    return response.data
  },

  async updateGroup(groupId: number, payload: Partial<CreateGroupPayload>): Promise<Group> {
    const response = await api.patch<Group>(`/api/groups/${groupId}`, payload)
    return response.data
  },

  async deleteGroup(groupId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}`)
  },

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const response = await api.get<GroupMember[]>(`/api/groups/${groupId}/members`)
    return response.data
  },

  async addGroupMember(groupId: number, userId: number): Promise<void> {
    await api.post(`/api/groups/${groupId}/members`, { user_id: userId })
  },

  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}/members/${userId}`)
  },

  async getGroupPermissions(groupId: number): Promise<Permission[]> {
    const response = await api.get<Permission[]>(`/api/groups/${groupId}/permissions`)
    return response.data
  },

  async addGroupPermission(
    groupId: number,
    payload: CreatePermissionPayload
  ): Promise<Permission> {
    const response = await api.post<Permission>(
      `/api/groups/${groupId}/permissions`,
      payload
    )
    return response.data
  },

  async deleteGroupPermission(groupId: number, permissionId: number): Promise<void> {
    await api.delete(`/api/groups/${groupId}/permissions/${permissionId}`)
  },
}
