import type { RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'

const sortColumns = {
  name: 'u.name',
  email: 'u.email',
  rating: 'r.rating',
  date: 'r."createdAt"',
} as const

type OwnerSortField = keyof typeof sortColumns
type SortOrder = 'asc' | 'desc'

const parsePositiveInt = (value: unknown, fallback: number, maximum?: number) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return maximum ? Math.min(parsed, maximum) : parsed
}

const parseQuery = (req: Parameters<RequestHandler>[0]) => {
  const sortBy = String(req.query.sortBy ?? 'date') as OwnerSortField
  const sortOrder = String(req.query.sortOrder ?? 'desc').toLowerCase() as SortOrder
  if (!(sortBy in sortColumns)) throw new AppError('Invalid sort field. Use name, email, rating, or date.', 400)
  if (sortOrder !== 'asc' && sortOrder !== 'desc') throw new AppError('Invalid sort order. Use asc or desc.', 400)
  return {
    search: String(req.query.search ?? '').trim().slice(0, 100),
    sortBy,
    sortOrder,
    page: parsePositiveInt(req.query.page, 1),
    limit: parsePositiveInt(req.query.limit, 10, 50),
  }
}

const ownedStore = (ownerId: string) => prisma.store.findUnique({
  where: { ownerId },
  select: { id: true, name: true, email: true, address: true },
})

const serializeRating = (row: { ratingId: string; rating: number; customerName: string; customerEmail: string; customerAddress: string; createdAt: Date }) => ({
  ratingId: row.ratingId,
  rating: Number(row.rating),
  customer: {
    name: row.customerName,
    email: row.customerEmail,
    address: row.customerAddress,
  },
  createdAt: row.createdAt,
})

export const getOwnerDashboard: RequestHandler = async (req, res, next) => {
  try {
    // Ownership is resolved exclusively from the authenticated JWT user id.
    const store = await ownedStore(req.auth!.userId)
    if (!store) {
      res.json({ success: true, data: { store: null, averageRating: 0, totalRatings: 0, recentRatings: [] } })
      return
    }

    const [aggregate, recentRatings] = await Promise.all([
      prisma.rating.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { rating: true } }),
      prisma.rating.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, rating: true, createdAt: true, user: { select: { name: true, email: true, address: true } } },
      }),
    ])

    res.json({
      success: true,
      data: {
        store: { name: store.name, email: store.email, address: store.address },
        averageRating: aggregate._avg.rating === null ? 0 : Number(Number(aggregate._avg.rating).toFixed(1)),
        totalRatings: aggregate._count.rating,
        recentRatings: recentRatings.map((item) => serializeRating({
          ratingId: item.id,
          rating: item.rating,
          customerName: item.user.name,
          customerEmail: item.user.email,
          customerAddress: item.user.address,
          createdAt: item.createdAt,
        })),
      },
    })
  } catch (error) { next(error) }
}

export const getOwnerRatings: RequestHandler = async (req, res, next) => {
  try {
    const query = parseQuery(req)
    // Ignore any storeId/ownerId query parameters: the store comes from req.auth.userId.
    const store = await ownedStore(req.auth!.userId)
    if (!store) {
      res.json({ success: true, storeAssigned: false, data: [], pagination: { page: query.page, limit: query.limit, total: 0, totalPages: 0 } })
      return
    }

    const offset = (query.page - 1) * query.limit
    const where = query.search
      ? Prisma.sql`WHERE r."storeId" = ${store.id} AND (u.name ILIKE ${`%${query.search}%`} OR u.email ILIKE ${`%${query.search}%`} OR u.address ILIKE ${`%${query.search}%`})`
      : Prisma.sql`WHERE r."storeId" = ${store.id}`
    const direction = query.sortOrder.toUpperCase()
    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<Array<{ ratingId: string; rating: number; customerName: string; customerEmail: string; customerAddress: string; createdAt: Date }>>(Prisma.sql`
        SELECT r.id AS "ratingId", r.rating, u.name AS "customerName", u.email AS "customerEmail", u.address AS "customerAddress", r."createdAt"
        FROM "Rating" r
        INNER JOIN "User" u ON u.id = r."userId"
        ${where}
        ORDER BY ${Prisma.raw(sortColumns[query.sortBy])} ${Prisma.raw(direction)}, r."createdAt" DESC
        LIMIT ${query.limit} OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total FROM "Rating" r INNER JOIN "User" u ON u.id = r."userId" ${where}`),
    ])
    const total = Number(countRows[0]?.total ?? 0)
    res.json({
      success: true,
      storeAssigned: true,
      data: rows.map(serializeRating),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    })
  } catch (error) { next(error) }
}
