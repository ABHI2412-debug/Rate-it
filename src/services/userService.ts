import { apiRequest } from './api'

export const userService = {
  updatePassword: (currentPassword: string, newPassword: string) => apiRequest<{ success: true; message: string }>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),
}
