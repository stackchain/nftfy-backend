import axios from 'axios'
import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc20SharesAbi from '../abi/erc20shares.json'
import erc721Abi from '../abi/erc721.json'
import erc721WrappedAbi from '../abi/erc721wrapped.json'
import nftfyAbi from '../abi/nftfy.json'
import { WalletErc721Item, WalletItem } from '../types/EthereumTypes'
import initializeWeb3 from './Web3Service'

// TODO: Get from firebase
const addressesERC721 = ['0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', '0xe48773a75b337ac258a471c00c6b450907b614bc']
const addressNftfy = '0x727638740980aA0aA0B346d02dd91120Eaac75ed'

async function getERC721Items(walletAddress: string): Promise<WalletErc721Item[]> {
  log(`getERC721Items - start - ${walletAddress}`)
  const web3 = initializeWeb3()

  const getERC721Item = async (addressERC721: string) => {
    let erc721Items: WalletErc721Item[] = []
    const contractERC721 = new web3.eth.Contract(erc721Abi as AbiItem[], addressERC721)

    const totalTokens = await contractERC721.methods.balanceOf(walletAddress).call()

    const name = await contractERC721.methods.name().call()
    const symbol = await contractERC721.methods.symbol().call()

    const tokensIdsPromises = []

    for (let i = 0; i < totalTokens; i++) {
      tokensIdsPromises.push(contractERC721.methods.tokenOfOwnerByIndex(walletAddress, i).call())
    }

    const tokensIds = await Promise.all(tokensIdsPromises)

    tokensIds.forEach(tokenId => {
      erc721Items.push({
        address: addressERC721,
        tokenId,
        name,
        symbol,
        image_url: ''
      })
    })

    const getErc721Metadata = async (address: string, tokenId: string) => {
      const metadata = await axios.get<{ description: string; image_url: string }>(
        `https://rinkeby-api.opensea.io/api/v1/asset/${address}/${tokenId}/`
      )

      const { description, image_url } = metadata.data

      return { address, tokenId, description, image_url }
    }

    const erc721ItemsMetadataPromises: Promise<{
      address: string
      tokenId: string
      description: string
      image_url: string
    }>[] = []

    erc721Items.forEach(erc721Item => erc721ItemsMetadataPromises.push(getErc721Metadata(erc721Item.address, erc721Item.tokenId)))

    const erc721ItemsMetadata = await Promise.all(erc721ItemsMetadataPromises)

    erc721Items = erc721Items.map(erc721Item => {
      const metadata = erc721ItemsMetadata.find(
        erc721ItemMetadata => erc721Item.address === erc721ItemMetadata.address && erc721Item.tokenId === erc721ItemMetadata.tokenId
      )

      if (metadata) {
        return { ...erc721Item, image_url: metadata.image_url, description: metadata.description }
      }

      return erc721Item
    })

    return erc721Items
  }

  const erc721Promises: Promise<WalletErc721Item[]>[] = []

  addressesERC721.forEach(addressERC721 => {
    erc721Promises.push(getERC721Item(addressERC721))
  })

  const erc721 = await Promise.all(erc721Promises)

  log(`getERC721Items - end - ${walletAddress} - total:${erc721.length + 1}`)
  return flatten(erc721)
}

async function getERC20Items(walletAddress: string): Promise<WalletItem[]> {
  log(`getERC20Items - start - ${walletAddress}`)
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

  const getERC20Balance = async (addressErc20: string): Promise<{ address: string; name: string; symbol: string; balance: number }> => {
    const contractWrapperErc721 = new web3.eth.Contract(erc20SharesAbi as AbiItem[], addressErc20)
    const balance = await contractWrapperErc721.methods.balanceOf(walletAddress).call()
    const name = await contractWrapperErc721.methods.name().call()
    const symbol = await contractWrapperErc721.methods.symbol().call()

    return { address: addressErc20, name, symbol, balance }
  }

  const erc20WithBalancePromises: Promise<{ address: string; name: string; symbol: string; balance: number }>[] = []

  for (let i = 0; i < erc20.length; i++) {
    erc20WithBalancePromises.push(getERC20Balance(erc20[i]))
  }

  const erc20Items = flatten((await Promise.all(erc20WithBalancePromises)).filter(erc20Item => erc20Item.balance > 0))

  const walletItems: WalletItem[] = erc20Items.map(erc20Item => ({
    erc721: {
      address: '',
      tokenId: '',
      name: '',
      symbol: '',
      image_url: ''
    },
    erc20: {
      address: erc20Item.address,
      name: erc20Item.name,
      symbol: erc20Item.symbol,
      balance: erc20Item.balance
    }
  }))

  return walletItems
}

export const getWalletItems = async (walletAddress: string): Promise<WalletItem[]> => {
  const items: WalletItem[] = []

  const erc721Items = await getERC721Items(walletAddress)
  const erc20Items = await getERC20Items(walletAddress)

  erc721Items.forEach(erc721Item => {
    items.push({
      erc721: erc721Item
    })
  })

  erc20Items.forEach(erc20Item => {
    items.push({
      erc721: erc20Item.erc721,
      erc20: erc20Item.erc20
    })
  })

  return items
}

export default getWalletItems
