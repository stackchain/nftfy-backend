import express from 'express'
import { walletERC20, walletERC721 } from './controllers/WalletController'

const router = express.Router()

router.get('/wallet/:wallet/erc20', walletERC20)
router.get('/wallet/:wallet/erc721', walletERC721)

export default router
