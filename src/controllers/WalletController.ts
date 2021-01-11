import { Request, Response } from 'express'
import { getERC20, getERC721 } from '../services/WalletService'

export async function walletERC20(req: Request, res: Response): Promise<void> {
  const walletAddress = req.params.wallet
  res.send(await getERC20(walletAddress))
}

export async function walletERC721(req: Request, res: Response): Promise<void> {
  const walletAddress = req.params.wallet
  res.send(await getERC721(walletAddress))
}
