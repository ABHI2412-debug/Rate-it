import type { RequestHandler } from 'express'
import { AppError } from './error.js'
import { isRole, verifyToken } from '../utils/jwt.js'
import type { Role } from '../types/auth.js'

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization')
  if (!header?.startsWith('Bearer ')) return next(new AppError('Authentication required', 401))

  try {
    const payload = verifyToken(header.slice(7).trim())
    if (!payload.userId || !isRole(payload.role)) throw new Error('Invalid payload')
    req.auth = payload
    next()
  } catch {
    next(new AppError('Invalid or expired token', 401))
  }
}

export const authorizeRoles = (...roles: Role[]): RequestHandler => (req, _res, next) => {
  if (!req.auth) return next(new AppError('Authentication required', 401))
  if (!roles.includes(req.auth.role)) return next(new AppError('You do not have permission to access this resource', 403))
  next()
}
