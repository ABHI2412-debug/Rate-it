import { apiRequest } from './api'

export type OwnerStore = { name: string; email: string; address: string }
export type OwnerRating = {
  ratingId: string
  rating: number
  customer: { name: string; email: string; address: string }
  createdAt: string
}
export type OwnerDashboard = {
  store: OwnerStore | null
  averageRating: number
  totalRatings: number
  recentRatings: OwnerRating[]
}
export type OwnerRatingsQuery = { search?: string; sortBy?: 'name' | 'email' | 'rating' | 'date'; sortOrder?: 'asc' | 'desc'; page?: number; limit?: number }
export type OwnerPagination = { page: number; limit: number; total: number; totalPages: number }

const queryString = (query: OwnerRatingsQuery) => {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)) })
  return params.toString()
}

export const ownerService = {
  dashboard: () => apiRequest<{ success: true; data: OwnerDashboard }>('/owner/dashboard'),
  ratings: (query: OwnerRatingsQuery = {}) => apiRequest<{ success: true; storeAssigned: boolean; data: OwnerRating[]; pagination: OwnerPagination }>(`/owner/ratings${queryString(query) ? `?${queryString(query)}` : ''}`),
}
