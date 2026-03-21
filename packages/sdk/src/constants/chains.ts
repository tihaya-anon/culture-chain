import { polygon, polygonMumbai, hardhat } from "viem/chains"

export const SUPPORTED_CHAINS = [polygon, polygonMumbai, hardhat] as const

const targetChainId = Number(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? 31337)

export const DEFAULT_CHAIN =
  targetChainId === polygon.id ? polygon :
  targetChainId === polygonMumbai.id ? polygonMumbai :
  hardhat
