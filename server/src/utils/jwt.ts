import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import type { JwtPayload, Role } from '../types/auth.js'

export const signToken = (payload: JwtPayload) => jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' })

export const verifyToken = (token: string) => jwt.verify(token, config.jwtSecret) as JwtPayload

export const isRole = (value: unknown): value is Role => value === 'ADMIN' || value === 'USER' || value === 'STORE_OWNER'
