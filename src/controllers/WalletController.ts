import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import { getNfyBalance, getWalletItems } from '../services/WalletService'

export default async function walletItems(req: Request, res: Response): Promise<void> {
  log(`getWalletItems - called`)
  const walletAddress = req.params.wallet
  res.send(await getWalletItems(walletAddress))
}

export async function nfyBalance(req: Request, res: Response): Promise<void> {
  log(`nfyBalance - called`)
  const walletAddress = req.params.wallet
  res.send(await getNfyBalance(walletAddress))
}
