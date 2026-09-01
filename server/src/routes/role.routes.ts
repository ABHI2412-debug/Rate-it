import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.js'
import { createAdminStore, createAdminUser, getAdminDashboard, getAdminUser, getAvailableStoreOwners, listAdminStores, listAdminUsers } from '../controllers/adminController.js'
import { getOwnerDashboard, getOwnerRatings } from '../controllers/ownerController.js'

export const adminRouter = Router()
adminRouter.use(authenticate, authorizeRoles('ADMIN'))
adminRouter.get('/dashboard', getAdminDashboard)
adminRouter.get('/users', listAdminUsers)
adminRouter.post('/users', createAdminUser)
adminRouter.get('/users/:userId', getAdminUser)
adminRouter.get('/stores', listAdminStores)
adminRouter.post('/stores', createAdminStore)
adminRouter.get('/store-owners', getAvailableStoreOwners)

export const ownerRouter = Router()
ownerRouter.use(authenticate, authorizeRoles('STORE_OWNER'))
ownerRouter.get('/dashboard', getOwnerDashboard)
ownerRouter.get('/ratings', getOwnerRatings)
