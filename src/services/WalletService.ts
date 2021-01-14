import { ERC20, ERC721 } from '../types/EthereumTypes'

export async function getERC20(): Promise<ERC20[]> {
  return [{ address: '123', tokenId: '1' }]
}

export async function getERC721(walletAddress: string): Promise<ERC721[]> {
  console.log('getERC721', walletAddress)

  return [{ address: '456', tokenId: '2' }]
}
