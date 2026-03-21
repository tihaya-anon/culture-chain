import { useWriteContract, useReadContract, useChainId } from "wagmi"
import { CONTRACT_ADDRESSES, type SupportedChainId } from "../constants/addresses"
import { CULTURE_NFT_ABI } from "../abis/CultureNFT.abi"

/** 铸造作品 NFT */
export function useMintWork() {
  const chainId = useChainId()
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.CultureNFT

  const { writeContract, writeContractAsync, ...rest } = useWriteContract()

  const mintWork = (args: readonly [string, bigint, bigint, string, number]) =>
    writeContract({
      address,
      abi: CULTURE_NFT_ABI,
      functionName: "mint",
      args,
    })

  const mintWorkAsync = (args: readonly [string, bigint, bigint, string, number]) =>
    writeContractAsync({
      address,
      abi: CULTURE_NFT_ABI,
      functionName: "mint",
      args,
    })

  return { address, mintWork, mintWorkAsync, writeContract, writeContractAsync, ...rest }
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

export function useSetApprovalForAll() {
  const chainId = useChainId()
  const address = CONTRACT_ADDRESSES[chainId as SupportedChainId]?.CultureNFT
  const { writeContract, writeContractAsync, ...rest } = useWriteContract()

  const setApprovalForAll = (operator: `0x${string}`, approved: boolean) =>
    writeContract({
      address,
      abi: CULTURE_NFT_ABI,
      functionName: "setApprovalForAll",
      args: [operator, approved],
    })

  const setApprovalForAllAsync = (operator: `0x${string}`, approved: boolean) =>
    writeContractAsync({
      address,
      abi: CULTURE_NFT_ABI,
      functionName: "setApprovalForAll",
      args: [operator, approved],
    })

  return { address, setApprovalForAll, setApprovalForAllAsync, writeContract, writeContractAsync, ...rest }
}
