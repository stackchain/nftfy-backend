import express from 'express'
import walletItems from './controllers/WalletController'

const router = express.Router()

router.get('/wallet/:wallet', walletItems)

export default router
