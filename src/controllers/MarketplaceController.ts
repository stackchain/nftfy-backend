import { Request, Response } from 'express'
import { log } from 'firebase-functions/lib/logger'
import getMarketplaceItems from '../services/MarketplaceService'

export default async function marketplaceItems(req: Request, res: Response): Promise<void> {
  log(`getMarketplaceItems - called`)
  res.send(await getMarketplaceItems())
}
