import { useWriteContract, useReadContract, useChainId } from "wagmi"
import { CONTRACT_ADDRESSES, type SupportedChainId } from "../constants/addresses"
import { CULTURE_NFT_ABI } from "../abis/CultureNFT.abi"

/** 铸造作品 NFT */
export function useMintWork() {
  const chainId = useChainId()
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.CultureNFT

  return useWriteContract()
  // 调用方式:
  // writeContract({
  //   address,
  //   abi: CULTURE_NFT_ABI,
  //   functionName: 'mint',
  //   args: [metadataURI, royaltyBps, supply, contentHash, category],
  // })
}

/** 查询用户持有某作品的数量 */
export function useWorkBalance(tokenId: bigint, account?: `0x${string}`) {
  const chainId = useChainId()
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.CultureNFT

  return useReadContract({
    address,
    abi: CULTURE_NFT_ABI,
    functionName: "balanceOf",
    args: account ? [account, tokenId] : undefined,
    query: { enabled: !!account },
  })
}

/** 查询版税信息 */
export function useRoyaltyInfo(tokenId: bigint, salePrice: bigint) {
  const chainId = useChainId()
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.CultureNFT

  return useReadContract({
    address,
    abi: CULTURE_NFT_ABI,
    functionName: "royaltyInfo",
    args: [tokenId, salePrice],
  })
}
