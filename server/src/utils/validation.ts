import { z } from 'zod'

export const email = z.string().trim().email('Invalid email format')
export const password = z.string()
  .min(8, 'Password must be 8–16 characters and include at least one uppercase letter and one special character (such as !, @, or #).')
  .max(16, 'Password must be 8–16 characters and include at least one uppercase letter and one special character (such as !, @, or #).')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter (A–Z).')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character (such as !, @, or #).')

export const signupSchema = z.object({
  name: z.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be 60 characters or fewer'),
  email,
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be 400 characters or fewer'),
  password,
})

export const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') })

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
})

export const ratingSchema = z.object({
  storeId: z.string().trim().min(1, 'Store is required'),
  rating: z.coerce.number().int('Rating must be a whole number').min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
})

export const ratingUpdateSchema = z.object({
  rating: z.coerce.number().int('Rating must be a whole number').min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
})

export const adminRoleSchema = z.enum(['ADMIN', 'USER', 'STORE_OWNER'])

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(20, 'Name must be at least 20 characters').max(60, 'Name must be 60 characters or fewer'),
  email,
  password,
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be 400 characters or fewer'),
  role: adminRoleSchema,
})

export const adminStoreCreateSchema = z.object({
  name: z.string().trim().min(20, 'Store name must be at least 20 characters').max(60, 'Store name must be 60 characters or fewer'),
  email,
  address: z.string().trim().min(1, 'Address is required').max(400, 'Address must be 400 characters or fewer'),
  ownerId: z.string().trim().min(1, 'Store owner is required'),
})
