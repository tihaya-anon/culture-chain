/**
 * 合约地址常量
 * 部署后从 apps/contracts/ignition/deployments 更新此文件
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
    CultureNFT: "" as `0x${string}`,
    Marketplace: "" as `0x${string}`,
    ShopRegistry: "" as `0x${string}`,
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES
