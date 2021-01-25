import express from 'express'
import marketplaceItems from './controllers/MarketplaceController'
import walletItems from './controllers/WalletController'

const router = express.Router()

router.get('/wallet/:wallet', walletItems)

router.get('/marketplace', marketplaceItems)

export default router
