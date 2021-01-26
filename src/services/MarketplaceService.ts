import axios from 'axios'
import { log } from 'firebase-functions/lib/logger'
import { flatten } from 'lodash'
import { AbiItem } from 'web3-utils'
import erc20SharesAbi from '../abi/erc20shares.json'
import erc721WrappedAbi from '../abi/erc721wrapped.json'
import nftfyAbi from '../abi/nftfy.json'
import { MarketplaceERC20Item } from '../types/MarketplaceTypes'
import initializeWeb3 from './Web3Service'

// TODO: Get from firebase
const addressesERC721 = [
  '0xE0394f4404182F537AC9F2F9695a4a4CD74a1ea3', // KIE
  '0xe48773a75b337ac258a471c00c6b450907b614bc', // PEPE
  '0x0934d8e80b3f40c19a2f92a280618af3d0266d4d', // TOP 50
  '0x0d86198a785d9cabf3ce9a2032d6cf4a1ec1235b',
  '0x2fe4fb7b83bb01679cbd03531c5cab63b0e2e6d7',
  '0xa2196b05547aedccd775a459c927d7559b16741a',
  '0x0d86198a785d9cabf3ce9a2032d6cf4a1ec1235b',
  '0x79e911825d9273e4127427a872a3f17d37252a5b',
  '0x466f19280ca84ee9d7953c5d12a2b4edb7b51bfb',
  '0x406cfa3147c190660618f3f1fddf166f8508e1f9',
  '0x8582029d31fe1373d27769a9ec64a9195e679eb7',
  '0xe96b4c84ed3732f320421f09cefcc4f97355e905',
  '0x3b829cfd48e2c7df548cab8af0e42ec788869134',
  '0xdee1031c5d64788976e78d78c63c2fd6b411c4ee',
  '0x74c9ea159f5f613f1f70f45f1fc1b5691f9cb97b',
  '0x06a57c13492affc173ebc71361aa2691d7583bb1',
  '0x0934d8e80b3f40c19a2f92a280618af3d0266d4d',
  '0x8fb36410207c3f8753df92b74611e4e8dfaa12fa',
  '0x926d845698d96980f464364c0b760d6dddb885e7',
  '0x3e052d2b720b1e6cd6f2a7cc12ec94a99a631e6e',
  '0x43f93df9133245cd095b99dff813e6c68c83368b',
  '0x17a58ba1d3adbb489a4152dd91293077984acf2a',
  '0x0043d638766ce6514ff0d857b6bdcb9d57390312',
  '0xd09a5790692e811f708721b7f25b7b9c4ea7cd99',
  '0x8e1580bb5dd3d202b7036b9787ef080ad0975f99',
  '0x6f6ef52cef5959e91a2c77656a7fe4a32cb5ab82',
  '0xb97a55129fa2388c88e7c1c5833b89491ed7ff39',
  '0xf18fa34bfbff59c42658484fa13a51ae2a95dd58',
  '0x34a85f495a15038b684afc64dbed905696727f79',
  '0x8824382015de561dc42a68968f46a5d12491d481',
  '0xed44109e5ae34a7f938a823317436627eebd88c0',
  '0x5b72715ef44f22a104eda950e6d4bbaf38903d9f',
  '0x988fe95559f0ef0867099f7ba420273ff60537b2',
  '0x9ef1095432a1e236cadf84248cf6ce271cc5926c',
  '0x1f18793f98911f31a3f9f0192a4129291a6c71cd',
  '0x10ad069e6a967bbfc0d9a4b09b07518f4c28afeb',
  '0xb4a87a89f3fc8060052079a323dfb5dd43955c14',
  '0xa1f161e8b599dde0ae759ec03e8bc79f8408b38e',
  '0x0e3899a6c22fb3b8049504e17a6bd0c38d0afe15',
  '0x2e3f660163f8aaab4e36b9736fd515f30242b7c6',
  '0xde3623bddb28432aa30c49ddc47d392c0509b601',
  '0x0f45720d8baff5614a566e3202a1718a87d593b7',
  '0x0ef2a40ca0e0fc8ecc483ab91b6be9247e99cb53',
  '0x48ca3c79e7fb49b1b1593bd1ad77c27880a31de1',
  '0xa1f5042644b2b5c54bb9f76b89f413a0037712fa',
  '0x43808b6240013ef37cfd2236471e7e086a7bcb9e',
  '0xd8bd52a5f928213ed774323660289c61312460c6',
  '0xcd7b1a079fad3399b05f899fd13fb9c7b9b86304',
  '0xcdcd6a8bcf79141828eec9541b2fd8e6479ffffd',
  '0x8b84b94784c1e9aa071197f555c55aac017b7da8',
  '0x1ef695dfef12f6f652bc70aad0e0551e2d7b668d',
  '0x854c34380809f163bb0415cef4fa891d36ee6ed2',
  '0x7a22ff20cd148a0d85af8cf0c9c837178d0f1aed',
  '0x0770cdb8932daa1005d2e25dbcc0a82686bb2faf',
  '0x6ce16f115ce95fab92c43cce0d42df54ca08db2b',
  '0xde63f8f51f0857d4ee59afe27bbb9762077be7e8',
  '0xc2fbe254f17d42d164184651c2d5319dfa050d7f',
  '0x7115abcca5f0702e177f172c1c14b3f686d6a63a',
  '0x7c2668bd0d3c050703cecc956c11bd520c26f7d4',
  '0x4F37310372dd39d451f7022EE587FA8B9F72d80B',
  '0x099944c2678f77277c603c0998d489f554a65816',
  '0xb5e35d93b77f544f4cf29c031c5d4d6aa131976e'
]
const addressNftfy = '0x727638740980aA0aA0B346d02dd91120Eaac75ed'

const getErc20OpenSeaMetadata = async (wrapper: string, tokenId: string) => {
  const metadata = await axios.get<{ description: string; image_url: string }>(
    `https://rinkeby-api.opensea.io/api/v1/asset/${wrapper}/${tokenId}/`
  )
  const { description, image_url } = metadata.data
  return { description, image_url }
}

const getMarketplaceItems = async (): Promise<MarketplaceERC20Item[]> => {
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
  return erc20Items
}
export default getMarketplaceItems
