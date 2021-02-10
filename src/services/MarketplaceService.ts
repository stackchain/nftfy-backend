import axios from 'axios'
import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc20SharesAbi from '../abi/erc20shares.json'
import erc721WrappedAbi from '../abi/erc721wrapped.json'
import nftfyAbi from '../abi/nftfy.json'
import { addressesERC721Mainnet, addressNftfyMainnet } from '../assets/mainnet'
import { addressesERC721Rinkeby, addressNftfyRinkeby } from '../assets/rinkeby'
import { MarketplaceERC20Item } from '../types/MarketplaceTypes'
import { Paged } from '../types/UtilTypes'
import paginator from './UtilService'
import initializeWeb3 from './Web3Service'

const network = process.env.NETWORK === '1'

const getErc20OpenSeaMetadata = async (wrapper: string, tokenId: string) => {
  const metadata = await axios.get<{ description: string; image_url: string }>(
    `https://${network ? '' : 'rinkeby-'}api.opensea.io/api/v1/asset/${wrapper}/${tokenId}/`
  )
  const { description, image_url } = metadata.data
  return { description, image_url }
}

const getMarketplaceItems = async (page?: number, limit?: number): Promise<Paged<MarketplaceERC20Item[]>> => {
  log(`getMarketplaceItems - start`)
  const web3 = initializeWeb3()

  const addressNftfy = network ? addressNftfyMainnet : addressNftfyRinkeby
  const addressesERC721 = network ? addressesERC721Mainnet : addressesERC721Rinkeby

  const contractNftfy = new web3.eth.Contract(nftfyAbi as AbiItem[], addressNftfy)

  const addressesWrappedERC721Promises: Promise<string>[] = []

  addressesERC721.forEach(addressERC721 => addressesWrappedERC721Promises.push(contractNftfy.methods.wrappers(addressERC721).call()))

  const addressesWrappedERC721 = (await Promise.all(addressesWrappedERC721Promises)).filter(
    addressWrapped721 => addressWrapped721 !== '0x0000000000000000000000000000000000000000'
  )

  const getErc20 = async (addressERC721Wrapper: string): Promise<string[]> => {
    const contractWrapperErc721 = new web3.eth.Contract(erc721WrappedAbi as AbiItem[], addressERC721Wrapper)
    const historyLength = await contractWrapperErc721.methods.historyLength().call()
    const erc20Promises: Promise<string>[] = []

    for (let i = 0; i < historyLength; i++) {
      erc20Promises.push(contractWrapperErc721.methods.historyAt(i).call())
    }

    return Promise.all(erc20Promises)
  }

  const erc20Promises: Promise<string[]>[] = []

  for (let i = 0; i < addressesWrappedERC721.length; i++) {
    erc20Promises.push(getErc20(addressesWrappedERC721[i]))
  }

  const erc20 = flatten(await Promise.all(erc20Promises))

  const getERC20Metadata = async (addressErc20: string): Promise<MarketplaceERC20Item> => {
    const contractErc20Shares = new web3.eth.Contract(erc20SharesAbi as AbiItem[], addressErc20)
    const name = await contractErc20Shares.methods.name().call()
    const tokenId = await contractErc20Shares.methods.tokenId().call()
    const symbol = await contractErc20Shares.methods.symbol().call()
    const erc721Wrapper = await contractErc20Shares.methods.wrapper().call()

    const contractWrapperErc721 = new web3.eth.Contract(erc721WrappedAbi as AbiItem[], erc721Wrapper)
    const securitized = await contractWrapperErc721.methods.securitized(tokenId).call()
    const erc721Address = await contractWrapperErc721.methods.target().call()

    const { description, image_url } = await getErc20OpenSeaMetadata(erc721Address, tokenId)

    return {
      address: addressErc20,
      name,
      symbol,
      securitized,
      erc721: {
        address: erc721Address,
        tokenId,
        wrapper: erc721Wrapper,
        image_url,
        description
      }
    }
  }

  const erc20WithMetadataPromises: Promise<MarketplaceERC20Item>[] = []

  for (let i = 0; i < erc20.length; i++) {
    erc20WithMetadataPromises.push(getERC20Metadata(erc20[i]))
  }

  const erc20Items = flatten(await Promise.all(erc20WithMetadataPromises)).filter(erc20Item => erc20Item.securitized)

  log(`getMarketplaceItems - end`)
  return paginator(erc20Items, page || 1, limit || 12)
}

export default getMarketplaceItems
