import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc721Abi from '../abi/erc721.json'
import { ERC20, ERC721 } from '../types/EthereumTypes'
import initializeWeb3 from './Web3Service'

export async function getERC20(): Promise<ERC20[]> {
  return [{ address: '123', tokenId: '1' }]
}

export async function getERC721Items(walletAddress: string): Promise<ERC721[]> {
  log(`getERC721Items - start - ${walletAddress}`)
  const web3 = initializeWeb3()
  const addressesERC721 = ['0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', '0xe48773a75B337AC258a471c00c6b450907b614Bc']

  const getERC721Item = async (addressERC721: string) => {
    const erc721: ERC721[] = []
    const contract = new web3.eth.Contract(erc721Abi as AbiItem[], addressERC721)

    const totalTokens = await contract.methods.balanceOf(walletAddress).call()
    const tokensIdsPromises = []

    for (let i = 0; i < totalTokens; i++) {
      tokensIdsPromises.push(contract.methods.tokenOfOwnerByIndex(walletAddress, i).call())
    }

    const tokensIds = await Promise.all(tokensIdsPromises)

    tokensIds.forEach(tokenId => {
      erc721.push({ address: addressERC721, tokenId })
    })

    return erc721
  }

  const erc721Promises: Promise<ERC721[]>[] = []

  addressesERC721.forEach(addressERC721 => {
    erc721Promises.push(getERC721Item(addressERC721))
  })

  const erc721 = await Promise.all(erc721Promises)

  log(`getERC721Items - end - ${walletAddress} - total:${erc721.length}`)
  return flatten(erc721)
}
