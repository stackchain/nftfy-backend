import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import { getERC721Items } from '../services/WalletService'

export async function walletERC20(req: Request, res: Response): Promise<void> {
  const walletAddress = req.params.wallet
  res.send(walletAddress)
}

export async function walletERC721(req: Request, res: Response): Promise<void> {
  log(`getERC721Items - called`)
  const walletAddress = req.params.wallet
  res.send(await getERC721Items(walletAddress))
}
