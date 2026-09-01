import express from 'express'
import cors from 'cors'
import { authRouter } from './routes/auth.routes.js'
import { userRouter } from './routes/user.routes.js'
import { adminRouter, ownerRouter } from './routes/role.routes.js'
import { errorHandler, notFound } from './middleware/error.js'
import { storeRouter } from './routes/store.routes.js'
import { ratingRouter } from './routes/rating.routes.js'

export const app = express()
app.use(cors())
app.use(express.json({ limit: '100kb' }))
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})
app.get('/api/health', (_req, res) => res.json({ success: true, message: 'RateSpace API is running' }))
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/admin', adminRouter)
app.use('/api/owner', ownerRouter)
app.use('/api/stores', storeRouter)
app.use('/api/ratings', ratingRouter)
app.use(notFound)
app.use(errorHandler)
