import express from 'express'
import { marketplaceItemByAddress, marketplaceItems } from './controllers/MarketplaceController'
import walletItems, { nfyBalance } from './controllers/WalletController'

const router = express.Router()

router.get('/wallet/:wallet/nfy', nfyBalance)
router.get('/wallet/:wallet', walletItems)

router.get('/marketplace', marketplaceItems)
router.get('/marketplace/:erc20Address', marketplaceItemByAddress)

export default router
