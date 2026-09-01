import { Router } from 'express'
import { updatePassword } from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'

export const userRouter = Router()
userRouter.patch('/me/password', authenticate, updatePassword)
