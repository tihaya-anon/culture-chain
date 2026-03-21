const envAddresses = {
  CultureNFT: process.env["NEXT_PUBLIC_CONTRACT_CULTURE_NFT"] as `0x${string}` | undefined,
  Marketplace: process.env["NEXT_PUBLIC_CONTRACT_MARKETPLACE"] as `0x${string}` | undefined,
  ShopRegistry: process.env["NEXT_PUBLIC_CONTRACT_SHOP_REGISTRY"] as `0x${string}` | undefined,
}

/**
 * 合约地址常量
 * 本地开发优先使用 .env.local，其次使用 deploy 脚本写回的静态值。
 */
export const CONTRACT_ADDRESSES = {
  /** Polygon Mainnet (chainId: 137) */
  137: {
    CultureNFT: "" as `0x${string}`,
    Marketplace: "" as `0x${string}`,
    ShopRegistry: "" as `0x${string}`,
  },
  /** Polygon Mumbai Testnet (chainId: 80001) */
  80001: {
    CultureNFT: "" as `0x${string}`,
    Marketplace: "" as `0x${string}`,
    ShopRegistry: "" as `0x${string}`,
  },
  /** Hardhat Local (chainId: 31337) */
  31337: {
    CultureNFT: envAddresses.CultureNFT ?? "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" as `0x${string}`,
    Marketplace: envAddresses.Marketplace ?? "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" as `0x${string}`,
    ShopRegistry: envAddresses.ShopRegistry ?? "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" as `0x${string}`,
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES
