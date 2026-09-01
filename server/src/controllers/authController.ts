import bcrypt from 'bcryptjs'
import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { loginSchema, signupSchema } from '../utils/validation.js'
import { publicUserSelect } from '../types/auth.js'
import { signToken } from '../utils/jwt.js'

export const signup: RequestHandler = async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (existing) throw new AppError('An account with this email already exists', 409)
    const user = await prisma.user.create({
      data: { ...input, email: input.email.toLowerCase(), password: await bcrypt.hash(input.password, 12), role: 'USER' },
      select: publicUserSelect,
    })
    res.status(201).json({ success: true, message: 'Account created successfully', user })
  } catch (error) { next(error) }
}

export const login: RequestHandler = async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } })
    if (!user || !(await bcrypt.compare(input.password, user.password))) throw new AppError('Invalid credentials', 401)
    const { password: _password, ...publicUser } = user
    const token = signToken({ userId: user.id, role: user.role })
    res.json({ success: true, token, user: publicUser })
  } catch (error) { next(error) }
}

export const me: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId }, select: publicUserSelect })
    if (!user) throw new AppError('User not found', 401)
    res.json({ success: true, user })
  } catch (error) { next(error) }
}
