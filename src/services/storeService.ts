import { apiRequest } from './api'

export type StoreRecord = {
  id: string
  name: string
  email: string
  address: string
  overallRating: number
  ratingCount: number
  userRating: number | null
  userRatingId: string | null
}

export type StoreQuery = { search?: string; sortBy?: 'name' | 'address' | 'overallRating' | 'ratingCount'; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }
export type StoreListResponse = { success: true; data: StoreRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }

export const storeService = {
  list: (query: StoreQuery = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
    return apiRequest<StoreListResponse>(`/stores${params.toString() ? `?${params}` : ''}`)
  },
  get: (storeId: string) => apiRequest<{ success: true; data: StoreRecord }>(`/stores/${storeId}`),
}

