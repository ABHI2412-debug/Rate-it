import type { RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { ratingSchema, ratingUpdateSchema } from '../utils/validation.js'

const storeSummary = (store: { id: string; name: string; address: string; ratings: { rating: number }[] }) => ({
  id: store.id,
  name: store.name,
  address: store.address,
  overallRating: store.ratings.length ? Number((store.ratings.reduce((sum, item) => sum + item.rating, 0) / store.ratings.length).toFixed(1)) : 0,
  ratingCount: store.ratings.length,
})

export const createRating: RequestHandler = async (req, res, next) => {
  try {
    const input = ratingSchema.parse(req.body)
    const store = await prisma.store.findUnique({ where: { id: input.storeId }, select: { id: true } })
    if (!store) throw new AppError('Store not found', 404)
    const existing = await prisma.rating.findUnique({ where: { userId_storeId: { userId: req.auth!.userId, storeId: input.storeId } } })
    if (existing) throw new AppError('You have already rated this store. You can modify your existing rating instead.', 409)
    const rating = await prisma.rating.create({ data: { userId: req.auth!.userId, storeId: input.storeId, rating: input.rating } })
    res.status(201).json({ success: true, message: 'Rating submitted successfully', data: { ratingId: rating.id, rating: rating.rating, storeId: rating.storeId, createdAt: rating.createdAt, updatedAt: rating.updatedAt } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('You have already rated this store. You can modify your existing rating instead.', 409))
    next(error)
  }
}

export const updateRating: RequestHandler = async (req, res, next) => {
  try {
    const input = ratingUpdateSchema.parse(req.body)
    const existing = await prisma.rating.findUnique({ where: { id: String(req.params.ratingId) }, select: { id: true, userId: true } })
    if (!existing) throw new AppError('Rating not found', 404)
    if (existing.userId !== req.auth!.userId) throw new AppError('You can only modify your own ratings', 403)
    const rating = await prisma.rating.update({ where: { id: existing.id }, data: { rating: input.rating } })
    res.json({ success: true, message: 'Rating updated successfully', data: { ratingId: rating.id, rating: rating.rating, storeId: rating.storeId, createdAt: rating.createdAt, updatedAt: rating.updatedAt } })
  } catch (error) { next(error) }
}

export const getMyRatings: RequestHandler = async (req, res, next) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { userId: req.auth!.userId }, orderBy: { updatedAt: 'desc' },
      select: { id: true, rating: true, createdAt: true, updatedAt: true, store: { select: { id: true, name: true, address: true, ratings: { select: { rating: true } } } } },
    })
    res.json({ success: true, data: ratings.map((item) => ({ ratingId: item.id, rating: item.rating, createdAt: item.createdAt, updatedAt: item.updatedAt, store: storeSummary(item.store) })) })
  } catch (error) { next(error) }
}
