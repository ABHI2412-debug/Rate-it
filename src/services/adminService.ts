import { apiRequest } from './api'
import type { Role } from '../auth/AuthContext'

export type AdminDashboardStats = { totalUsers: number; totalStores: number; totalRatings: number }
export type AdminUser = { id: string; name: string; email: string; address: string; role: Role; createdAt: string; updatedAt: string }
export type AdminUserDetails = AdminUser & { store?: { id: string; name: string; overallRating: number; ratingCount: number } | null }
export type StoreOwnerOption = { id: string; name: string; email: string }
export type AdminStore = { id: string; name: string; email: string; address: string; overallRating: number; ratingCount: number; owner: StoreOwnerOption; createdAt: string }
export type Pagination = { page: number; limit: number; total: number; totalPages: number }
export type AdminListQuery = { search?: string; name?: string; email?: string; address?: string; role?: Role; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }
export type CreateAdminUserInput = { name: string; email: string; password: string; address: string; role: Role }
export type CreateAdminStoreInput = { name: string; email: string; address: string; ownerId: string }

const queryString = (query: Record<string, unknown>) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.toString()
}

export const adminService = {
  dashboard: () => apiRequest<{ success: true; data: AdminDashboardStats }>('/admin/dashboard'),
  users: (query: AdminListQuery = {}) => apiRequest<{ success: true; data: AdminUser[]; pagination: Pagination }>(`/admin/users${queryString(query) ? `?${queryString(query)}` : ''}`),
  createUser: (input: CreateAdminUserInput) => apiRequest<{ success: true; message: string; data: AdminUser }>('/admin/users', { method: 'POST', body: JSON.stringify(input) }),
  user: (userId: string) => apiRequest<{ success: true; data: AdminUserDetails }>(`/admin/users/${userId}`),
  stores: (query: AdminListQuery = {}) => apiRequest<{ success: true; data: AdminStore[]; pagination: Pagination }>(`/admin/stores${queryString(query) ? `?${queryString(query)}` : ''}`),
  createStore: (input: CreateAdminStoreInput) => apiRequest<{ success: true; message: string; data: AdminStore }>('/admin/stores', { method: 'POST', body: JSON.stringify(input) }),
  availableStoreOwners: () => apiRequest<{ success: true; data: StoreOwnerOption[] }>('/admin/store-owners'),
}
