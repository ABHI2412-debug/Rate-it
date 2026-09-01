import type { RequestHandler } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'

const sortFields = new Set(['name', 'address', 'overallRating', 'ratingCount'])
const sortOrders = new Set(['asc', 'desc'])

const parsePositiveInt = (value: unknown, fallback: number, maximum?: number) => {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return maximum ? Math.min(parsed, maximum) : parsed
}

const serializeStore = (store: { id: string; name: string; email: string; address: string; overallRating: number | null; ratingCount: number; userRating: number | null; userRatingId?: string | null }) => ({
  ...store,
  overallRating: store.overallRating === null ? 0 : Number(Number(store.overallRating).toFixed(1)),
  ratingCount: Number(store.ratingCount),
  userRating: store.userRating === null ? null : Number(store.userRating),
  userRatingId: store.userRatingId ?? null,
})

async function queryStores({ search, sortBy, sortOrder, page, limit, userId }: { search: string; sortBy: string; sortOrder: 'asc' | 'desc'; page: number; limit: number; userId?: string }) {
  const offset = (page - 1) * limit
  const searchFilter = search ? Prisma.sql`WHERE s.name ILIKE ${`%${search}%`} OR s.address ILIKE ${`%${search}%`}` : Prisma.empty
  const userRating = userId ? Prisma.sql`(SELECT r_user.rating FROM "Rating" r_user WHERE r_user."storeId" = s.id AND r_user."userId" = ${userId} LIMIT 1)` : Prisma.sql`NULL`
  const userRatingId = userId ? Prisma.sql`(SELECT r_user.id FROM "Rating" r_user WHERE r_user."storeId" = s.id AND r_user."userId" = ${userId} LIMIT 1)` : Prisma.sql`NULL`
  const sortColumn = sortBy === 'name' ? Prisma.sql`s.name` : sortBy === 'address' ? Prisma.sql`s.address` : sortBy === 'ratingCount' ? Prisma.sql`COUNT(r.id)` : Prisma.sql`COALESCE(AVG(r.rating), 0)`
  const direction = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
  const rows = await prisma.$queryRaw<Array<{ id: string; name: string; email: string; address: string; overallRating: number | null; ratingCount: number; userRating: number | null; userRatingId: string | null }>>(Prisma.sql`
    SELECT s.id, s.name, s.email, s.address,
      AVG(r.rating)::float AS "overallRating",
      COUNT(r.id)::int AS "ratingCount",
      ${userRating} AS "userRating",
      ${userRatingId} AS "userRatingId"
    FROM "Store" s
    LEFT JOIN "Rating" r ON r."storeId" = s.id
    ${searchFilter}
    GROUP BY s.id
    ORDER BY ${sortColumn} ${direction}, s.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `)
  const [{ total }] = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total FROM "Store" s ${searchFilter}`)
  return { rows: rows.map(serializeStore), total: Number(total) }
}

export const listStores: RequestHandler = async (req, res, next) => {
  try {
    const sortBy = String(req.query.sortBy ?? 'name')
    const sortOrder = String(req.query.sortOrder ?? 'asc').toLowerCase()
    if (!sortFields.has(sortBy)) throw new AppError('Invalid sort field. Use name, address, overallRating, or ratingCount.', 400)
    if (!sortOrders.has(sortOrder)) throw new AppError('Invalid sort order. Use asc or desc.', 400)
    const page = parsePositiveInt(req.query.page, 1)
    const limit = parsePositiveInt(req.query.limit, 12, 50)
    const search = String(req.query.search ?? '').trim().slice(0, 100)
    const { rows, total } = await queryStores({ search, sortBy, sortOrder: sortOrder as 'asc' | 'desc', page, limit, userId: req.auth?.userId })
    res.json({ success: true, data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const getStore: RequestHandler = async (req, res, next) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: String(req.params.storeId) }, select: { id: true, name: true, email: true, address: true } })
    if (!store) throw new AppError('Store not found', 404)
    const aggregate = await prisma.rating.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { rating: true } })
    const userRatingRecord = req.auth ? await prisma.rating.findUnique({ where: { userId_storeId: { userId: req.auth.userId, storeId: store.id } }, select: { id: true, rating: true } }) : null
    res.json({ success: true, data: serializeStore({ ...store, overallRating: aggregate._avg.rating, ratingCount: aggregate._count.rating, userRating: userRatingRecord?.rating ?? null, userRatingId: userRatingRecord?.id ?? null }) })
  } catch (error) { next(error) }
}
