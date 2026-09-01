import { apiRequest } from './api'

export type RatingRecord = { ratingId: string; rating: number; createdAt: string; updatedAt: string; store: { id: string; name: string; address: string; overallRating: number; ratingCount: number } }
export type RatingMutation = { ratingId: string; rating: number; storeId: string; createdAt: string; updatedAt: string }

export const ratingService = {
  create: (storeId: string, rating: number) => apiRequest<{ success: true; message: string; data: RatingMutation }>('/ratings', { method: 'POST', body: JSON.stringify({ storeId, rating }) }),
  update: (ratingId: string, rating: number) => apiRequest<{ success: true; message: string; data: RatingMutation }>(`/ratings/${ratingId}`, { method: 'PATCH', body: JSON.stringify({ rating }) }),
  mine: () => apiRequest<{ success: true; data: RatingRecord[] }>('/ratings/me'),
}

