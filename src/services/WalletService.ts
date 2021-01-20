import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc20SharesAbi from '../abi/erc20shares.json'
import erc721Abi from '../abi/erc721.json'
import erc721WrappedAbi from '../abi/erc721wrapped.json'
import nftfyAbi from '../abi/nftfy.json'
import { ERC20, ERC721 } from '../types/EthereumTypes'
import initializeWeb3 from './Web3Service'

export async function getERC721Items(walletAddress: string): Promise<ERC721[]> {
  log(`getERC721Items - start - ${walletAddress}`)
  const web3 = initializeWeb3()

  // TODO: Get from firebase
  const addressesERC721 = ['0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', '0xe48773a75b337ac258a471c00c6b450907b614bc']

  const getERC721Item = async (addressERC721: string) => {
    const erc721: ERC721[] = []
    const contractERC721 = new web3.eth.Contract(erc721Abi as AbiItem[], addressERC721)

    const totalTokens = await contractERC721.methods.balanceOf(walletAddress).call()
    const tokensIdsPromises = []

    for (let i = 0; i < totalTokens; i++) {
      tokensIdsPromises.push(contractERC721.methods.tokenOfOwnerByIndex(walletAddress, i).call())
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

  log(`getERC721Items - end - ${walletAddress} - total:${erc721.length + 1}`)
  return flatten(erc721)
}

export async function getERC20Items(walletAddress: string): Promise<ERC20[]> {
  const web3 = initializeWeb3()
  const erc721 = await getERC721Items(walletAddress)

  // TODO: Get from firebase
  const addressNftfy = '0x727638740980aA0aA0B346d02dd91120Eaac75ed'
  const contractNftfy = new web3.eth.Contract(nftfyAbi as AbiItem[], addressNftfy)

  // TODO: Get from firebase
  const addressesERC721 = ['0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', '0xe48773a75b337ac258a471c00c6b450907b614bc']
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

  const getERC20Balance = async (addressErc20: string): Promise<{ address: string; balance: number }> => {
    const contractWrapperErc721 = new web3.eth.Contract(erc20SharesAbi as AbiItem[], addressErc20)
    const balance = await contractWrapperErc721.methods.balanceOf(walletAddress).call()

    return { address: addressErc20, balance }
  }

  const erc20WithBalancePromises: Promise<{ address: string; balance: number }>[] = []

  for (let i = 0; i < erc20.length; i++) {
    erc20WithBalancePromises.push(getERC20Balance(erc20[i]))
  }

  return flatten((await Promise.all(erc20WithBalancePromises)).filter(erc20Item => erc20Item.balance > 0))
}
