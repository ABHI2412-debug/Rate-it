import bcrypt from 'bcryptjs'
import type { RequestHandler } from 'express'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { passwordUpdateSchema } from '../utils/validation.js'

export const updatePassword: RequestHandler = async (req, res, next) => {
  try {
    const input = passwordUpdateSchema.parse(req.body)
    if (input.currentPassword === input.newPassword) throw new AppError('New password must be different from the current password', 400)
    const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } })
    if (!user || !(await bcrypt.compare(input.currentPassword, user.password))) throw new AppError('Current password is incorrect', 400)
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(input.newPassword, 12) } })
    res.json({ success: true, message: 'Password updated successfully' })
  } catch (error) { next(error) }
}
