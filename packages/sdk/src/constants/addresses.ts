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
    CultureNFT: envAddresses.CultureNFT ?? "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c" as `0x${string}`,
    Marketplace: envAddresses.Marketplace ?? "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d" as `0x${string}`,
    ShopRegistry: envAddresses.ShopRegistry ?? "0x68B1D87F95878fE05B998F19b66F4baba5De1aed" as `0x${string}`,
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES
