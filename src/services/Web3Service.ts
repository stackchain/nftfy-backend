import Web3 from 'web3'

export default function initializeWeb3(): Web3 {
  if (!process.env.INFURA) {
    throw new Error('Missing INFURA env variable')
  }

  return new Web3(process.env.INFURA)
}
