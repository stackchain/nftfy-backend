import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import { getMarketplaceItemByAddress, getMarketplaceItems } from '../services/MarketplaceService'

export async function marketplaceItems(req: Request, res: Response): Promise<void> {
  log(`marketplaceItems - called`)

  const page = Number(req.query.page)
  const limit = Number(req.query.limit)

  res.send(await getMarketplaceItems(page, limit))
}

export async function marketplaceItemByAddress(req: Request, res: Response): Promise<void> {
  log(`marketplaceItemByAddress - called`)

  const { erc20Address } = req.params

  res.send(await getMarketplaceItemByAddress(erc20Address))
}
