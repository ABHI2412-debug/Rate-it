import bcrypt from 'bcryptjs'
import type { RequestHandler } from 'express'
import { Prisma, Role } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { AppError } from '../middleware/error.js'
import { adminRoleSchema, adminStoreCreateSchema, adminUserCreateSchema, email } from '../utils/validation.js'

const userSortFields = new Set(['name', 'email', 'address', 'role', 'createdAt'])
const storeSortFields = new Set(['name', 'email', 'address', 'overallRating', 'ratingCount', 'createdAt'])
const sortOrders = new Set(['asc', 'desc'])
const roles = new Set(['ADMIN', 'USER', 'STORE_OWNER'])

const toQueryString = (value: unknown) => typeof value === 'string' ? value.trim() : ''

const parsePagination = (query: Record<string, unknown>) => {
  const pageValue = query.page === undefined ? 1 : Number(query.page)
  const limitValue = query.limit === undefined ? 10 : Number(query.limit)
  if (!Number.isInteger(pageValue) || pageValue < 1) throw new AppError('Page must be a positive integer', 400)
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 50) throw new AppError('Limit must be a positive integer no greater than 50', 400)
  return { page: pageValue, limit: limitValue }
}

const parseSort = (query: Record<string, unknown>, fields: Set<string>, defaultField: string) => {
  const sortBy = toQueryString(query.sortBy) || defaultField
  const sortOrder = (toQueryString(query.sortOrder) || 'asc').toLowerCase()
  if (!fields.has(sortBy)) throw new AppError(`Invalid sort field: ${sortBy}`, 400)
  if (!sortOrders.has(sortOrder)) throw new AppError('Invalid sort order. Use asc or desc.', 400)
  return { sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
}

const userSelect = { id: true, name: true, email: true, address: true, role: true, createdAt: true, updatedAt: true } as const

export const getAdminDashboard: RequestHandler = async (_req, res, next) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count(),
    ])
    res.json({ success: true, data: { totalUsers, totalStores, totalRatings } })
  } catch (error) { next(error) }
}

export const listAdminUsers: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query)
    const { sortBy, sortOrder } = parseSort(req.query, userSortFields, 'createdAt')
    const search = toQueryString(req.query.search).slice(0, 100)
    const roleFilter = toQueryString(req.query.role)
    if (roleFilter && !roles.has(roleFilter)) throw new AppError('Invalid role. Use ADMIN, USER, or STORE_OWNER.', 400)
    const filters: Prisma.UserWhereInput[] = []
    if (search) filters.push({ OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }, { address: { contains: search, mode: 'insensitive' } }] })
    for (const field of ['name', 'email', 'address'] as const) {
      const value = toQueryString(req.query[field])
      if (value) filters.push({ [field]: { contains: value.slice(0, 100), mode: 'insensitive' } })
    }
    if (roleFilter) filters.push({ role: roleFilter as Role })
    const where: Prisma.UserWhereInput = filters.length ? { AND: filters } : {}
    const orderBy = { [sortBy]: sortOrder } as Prisma.UserOrderByWithRelationInput
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, select: userSelect, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.user.count({ where }),
    ])
    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const createAdminUser: RequestHandler = async (req, res, next) => {
  try {
    const input = adminUserCreateSchema.parse(req.body)
    const normalizedEmail = input.email.toLowerCase()
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } })
    if (existing) throw new AppError('An account with this email already exists.', 409)
    const user = await prisma.user.create({
      data: { name: input.name, email: normalizedEmail, address: input.address, password: await bcrypt.hash(input.password, 12), role: input.role as Role },
      select: userSelect,
    })
    res.status(201).json({ success: true, message: 'User created successfully', data: user })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('An account with this email already exists.', 409))
    next(error)
  }
}

export const getAdminUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(req.params.userId) },
      select: { ...userSelect, ownedStore: { select: { id: true, name: true, ratings: { select: { rating: true } } } } },
    })
    if (!user) throw new AppError('User not found', 404)
    const { ownedStore, ...publicUser } = user
    const data = user.role === 'STORE_OWNER' ? {
      ...publicUser,
      store: ownedStore ? {
        id: ownedStore.id,
        name: ownedStore.name,
        overallRating: ownedStore.ratings.length ? Number((ownedStore.ratings.reduce((sum, item) => sum + item.rating, 0) / ownedStore.ratings.length).toFixed(1)) : 0,
        ratingCount: ownedStore.ratings.length,
      } : null,
    } : publicUser
    res.json({ success: true, data })
  } catch (error) { next(error) }
}

const storeWhereSql = (query: Record<string, unknown>) => {
  const conditions: Prisma.Sql[] = []
  const search = toQueryString(query.search).slice(0, 100)
  if (search) conditions.push(Prisma.sql`(s.name ILIKE ${`%${search}%`} OR s.email ILIKE ${`%${search}%`} OR s.address ILIKE ${`%${search}%`})`)
  for (const field of ['name', 'email', 'address'] as const) {
    const value = toQueryString(query[field])
    if (value) conditions.push(Prisma.sql`s.${Prisma.raw(field)} ILIKE ${`%${value.slice(0, 100)}%`}`)
  }
  return conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty
}

const serializeAdminStore = (store: { id: string; name: string; email: string; address: string; ownerId: string; ownerName: string; ownerEmail: string; overallRating: number | null; ratingCount: number; createdAt: Date }) => ({
  id: store.id, name: store.name, email: store.email, address: store.address,
  overallRating: store.overallRating === null ? 0 : Number(Number(store.overallRating).toFixed(1)),
  ratingCount: Number(store.ratingCount), owner: { id: store.ownerId, name: store.ownerName, email: store.ownerEmail }, createdAt: store.createdAt,
})

export const listAdminStores: RequestHandler = async (req, res, next) => {
  try {
    const { page, limit } = parsePagination(req.query)
    const { sortBy, sortOrder } = parseSort(req.query, storeSortFields, 'createdAt')
    const where = storeWhereSql(req.query)
    const sortColumn = sortBy === 'name' ? Prisma.sql`s.name` : sortBy === 'email' ? Prisma.sql`s.email` : sortBy === 'address' ? Prisma.sql`s.address` : sortBy === 'createdAt' ? Prisma.sql`s."createdAt"` : sortBy === 'ratingCount' ? Prisma.sql`COUNT(r.id)` : Prisma.sql`COALESCE(AVG(r.rating), 0)`
    const direction = sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`
    const offset = (page - 1) * limit
    const [rows, totalRows] = await Promise.all([
      prisma.$queryRaw<Array<{ id: string; name: string; email: string; address: string; ownerId: string; ownerName: string; ownerEmail: string; overallRating: number | null; ratingCount: number; createdAt: Date }>>(Prisma.sql`
        SELECT s.id, s.name, s.email, s.address, s."ownerId" AS "ownerId", u.name AS "ownerName", u.email AS "ownerEmail", s."createdAt",
          AVG(r.rating)::float AS "overallRating", COUNT(r.id)::int AS "ratingCount"
        FROM "Store" s JOIN "User" u ON u.id = s."ownerId" LEFT JOIN "Rating" r ON r."storeId" = s.id
        ${where}
        GROUP BY s.id, u.id
        ORDER BY ${sortColumn} ${direction}, s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `),
      prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`SELECT COUNT(*)::int AS total FROM "Store" s ${where}`),
    ])
    const total = Number(totalRows[0]?.total ?? 0)
    res.json({ success: true, data: rows.map(serializeAdminStore), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) { next(error) }
}

export const getAvailableStoreOwners: RequestHandler = async (_req, res, next) => {
  try {
    const owners = await prisma.user.findMany({ where: { role: 'STORE_OWNER', ownedStore: { is: null } }, select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } })
    res.json({ success: true, data: owners })
  } catch (error) { next(error) }
}

export const createAdminStore: RequestHandler = async (req, res, next) => {
  try {
    const input = adminStoreCreateSchema.parse(req.body)
    const owner = await prisma.user.findUnique({ where: { id: input.ownerId }, select: { id: true, role: true, ownedStore: { select: { id: true } } } })
    if (!owner || owner.role !== 'STORE_OWNER') throw new AppError('Selected user is not a Store Owner.', 400)
    if (owner.ownedStore) throw new AppError('This Store Owner already manages a store.', 409)
    const store = await prisma.store.create({ data: { name: input.name, email: input.email.toLowerCase(), address: input.address, ownerId: owner.id }, select: { id: true, name: true, email: true, address: true, ownerId: true, createdAt: true } })
    res.status(201).json({ success: true, message: 'Store created successfully', data: store })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return next(new AppError('This Store Owner already manages a store.', 409))
    next(error)
  }
}
