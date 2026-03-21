import { useWriteContract, useReadContract, useChainId } from "wagmi"
import { parseEther } from "viem"
import { CONTRACT_ADDRESSES, type SupportedChainId } from "../constants/addresses"
import { MARKETPLACE_ABI } from "../abis/Marketplace.abi"

function useMarketplaceAddress() {
  const chainId = useChainId()
  return CONTRACT_ADDRESSES[chainId as SupportedChainId]?.Marketplace
}

/** 购买上架作品 */
export function useBuyItem() {
  const address = useMarketplaceAddress()
  const { writeContract, writeContractAsync, ...rest } = useWriteContract()

  const buyItem = (listingId: bigint, amount: bigint, priceWei: bigint) => {
    writeContract({
      address,
      abi: MARKETPLACE_ABI,
      functionName: "buyItem",
      args: [listingId, amount],
      value: priceWei * amount,
    })
  }

  const buyItemAsync = (listingId: bigint, amount: bigint, priceWei: bigint) =>
    writeContractAsync({
      address,
      abi: MARKETPLACE_ABI,
      functionName: "buyItem",
      args: [listingId, amount],
      value: priceWei * amount,
    })

  return { address, buyItem, buyItemAsync, writeContract, writeContractAsync, ...rest }
}

/** 上架作品 */
export function useListItem() {
  const address = useMarketplaceAddress()
  const { writeContract, writeContractAsync, ...rest } = useWriteContract()

  const listItem = (tokenId: bigint, priceEther: string, amount: bigint) => {
    writeContract({
      address,
      abi: MARKETPLACE_ABI,
      functionName: "listItem",
      args: [tokenId, parseEther(priceEther), amount],
    })
  }

  const listItemAsync = (tokenId: bigint, priceEther: string, amount: bigint) =>
    writeContractAsync({
      address,
      abi: MARKETPLACE_ABI,
      functionName: "listItem",
      args: [tokenId, parseEther(priceEther), amount],
    })

  return { address, listItem, listItemAsync, writeContract, writeContractAsync, ...rest }
}

/** 查询待提取收益 */
export function usePendingWithdrawal(account?: `0x${string}`) {
  const address = useMarketplaceAddress()

  return useReadContract({
    address,
    abi: MARKETPLACE_ABI,
    functionName: "pendingWithdrawal",
    args: account ? [account] : undefined,
    query: { enabled: !!account },
  })
}

/** 提取收益 */
export function useWithdraw() {
  const address = useMarketplaceAddress()
  const { writeContract, ...rest } = useWriteContract()

  const withdraw = () => {
    writeContract({
      address,
      abi: MARKETPLACE_ABI,
      functionName: "withdraw",
    })
  }

  return { withdraw, ...rest }
}
