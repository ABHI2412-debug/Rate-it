import { Router } from 'express'
import { getStore, listStores } from '../controllers/storeController.js'
import { authenticate } from '../middleware/auth.js'

export const storeRouter = Router()
storeRouter.get('/', (req, res, next) => {
  const header = req.header('authorization')
  if (header) return authenticate(req, res, next)
  return listStores(req, res, next)
}, listStores)
storeRouter.get('/:storeId', (req, res, next) => {
  const header = req.header('authorization')
  if (header) return authenticate(req, res, next)
  return getStore(req, res, next)
}, getStore)

