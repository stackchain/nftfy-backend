import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import getMarketplaceItems from '../services/MarketplaceService'

export default async function marketplaceItems(req: Request, res: Response): Promise<void> {
  log(`getMarketplaceItems - called`)

  const page = Number(req.query.page)
  const limit = Number(req.query.limit)

  res.send(await getMarketplaceItems(page, limit))
}
