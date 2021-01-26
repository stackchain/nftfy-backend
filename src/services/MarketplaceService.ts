import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc20SharesAbi from '../abi/erc20shares.json'
import erc721WrappedAbi from '../abi/erc721wrapped.json'
import nftfyAbi from '../abi/nftfy.json'
import { MarketplaceERC20Item } from '../types/MarketplaceTypes'
import initializeWeb3 from './Web3Service'

// TODO: Get from firebase
const addressesERC721 = ['0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', '0xe48773a75b337ac258a471c00c6b450907b614bc']
const addressNftfy = '0x727638740980aA0aA0B346d02dd91120Eaac75ed'

const getMarketplaceItems = async () => {
  log(`getMarketplaceItems - start`)
  const web3 = initializeWeb3()

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
    const wrapper = await contractErc20Shares.methods.wrapper().call()

    const contractWrapperErc721 = new web3.eth.Contract(erc721WrappedAbi as AbiItem[], wrapper)
    const securitized = await contractWrapperErc721.methods.securitized(tokenId).call()

    return { address: addressErc20, tokenId, name, symbol, wrapper, securitized }
  }

  const erc20WithMetadataPromises: Promise<MarketplaceERC20Item>[] = []

  for (let i = 0; i < erc20.length; i++) {
    erc20WithMetadataPromises.push(getERC20Metadata(erc20[i]))
  }

  const erc20Items = flatten(await Promise.all(erc20WithMetadataPromises)).filter(erc20Item => erc20Item.securitized)

  return erc20Items
}
export default getMarketplaceItems
