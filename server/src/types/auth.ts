export type Role = 'ADMIN' | 'USER' | 'STORE_OWNER'

export type PublicUser = {
  id: string
  name: string
  email: string
  address: string
  role: Role
}

export type JwtPayload = {
  userId: string
  role: Role
}

declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload
    }
  }
}

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  address: true,
  role: true,
} as const
