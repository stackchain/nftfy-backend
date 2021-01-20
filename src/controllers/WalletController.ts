import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import { getWalletItems } from '../services/WalletService'

export default async function walletItems(req: Request, res: Response): Promise<void> {
  log(`getWalletItems - called`)
  const walletAddress = req.params.wallet
  res.send(await getWalletItems(walletAddress))
}
