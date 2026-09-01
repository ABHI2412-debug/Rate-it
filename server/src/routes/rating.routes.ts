import { Router } from 'express'
import { createRating, getMyRatings, updateRating } from '../controllers/ratingController.js'
import { authenticate, authorizeRoles } from '../middleware/auth.js'

export const ratingRouter = Router()
ratingRouter.use(authenticate, authorizeRoles('USER'))
ratingRouter.post('/', createRating)
ratingRouter.patch('/:ratingId', updateRating)
ratingRouter.get('/me', getMyRatings)

