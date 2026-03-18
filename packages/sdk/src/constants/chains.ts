import { polygon, polygonMumbai, hardhat } from "viem/chains"

export const SUPPORTED_CHAINS = [polygon, polygonMumbai, hardhat] as const

export const DEFAULT_CHAIN =
  process.env["NODE_ENV"] === "production" ? polygon : polygonMumbai
