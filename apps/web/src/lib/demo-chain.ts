import "server-only"

import { createPublicClient, formatEther, http, parseEventLogs } from "viem"
import { hardhat, polygon, polygonMumbai } from "viem/chains"
import { CULTURE_NFT_ABI, MARKETPLACE_ABI, CONTRACT_ADDRESSES } from "@culture-chain/sdk"
import type { BadgeVariant } from "@/components/ui/Badge"
import type { Work } from "@/components/works/WorkCard"

const CHAIN_ID = Number(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? 31337)
const RPC_URL = process.env["NEXT_PUBLIC_POLYGON_RPC_URL"] ?? "http://127.0.0.1:8545"
const ACTIVE_CHAIN =
  CHAIN_ID === polygon.id ? polygon :
  CHAIN_ID === polygonMumbai.id ? polygonMumbai :
  hardhat
const DEFAULT_COVER = "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5b21b6" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
      </defs>
      <rect width="800" height="1000" fill="url(#g)" />
      <circle cx="660" cy="180" r="120" fill="rgba(255,255,255,0.12)" />
      <circle cx="160" cy="840" r="180" fill="rgba(255,255,255,0.08)" />
      <text x="80" y="820" fill="white" font-size="78" font-family="Georgia, serif">CultureChain</text>
      <text x="80" y="900" fill="rgba(255,255,255,0.78)" font-size="34" font-family="Arial, sans-serif">Local Demo</text>
    </svg>`
  )

export interface DemoWork extends Work {
  description: string
  metadataURI: string
  royaltyBps: number
  listingId?: string
  availableAmount?: number
}

interface MetadataPayload {
  title?: string
  description?: string
  coverImage?: string
  creatorName?: string
}

const publicClient = createPublicClient({
  chain: ACTIVE_CHAIN,
  transport: http(RPC_URL),
})
const workMintedEvent = CULTURE_NFT_ABI.find((item) => item.type === "event" && item.name === "WorkMinted")
const itemListedEvent = MARKETPLACE_ABI.find((item) => item.type === "event" && item.name === "ItemListed")
const itemSoldEvent = MARKETPLACE_ABI.find((item) => item.type === "event" && item.name === "ItemSold")

function getAddresses() {
  const addresses = CONTRACT_ADDRESSES[CHAIN_ID as keyof typeof CONTRACT_ADDRESSES]
  if (!addresses?.CultureNFT || !addresses.Marketplace) {
    return null
  }
  return addresses
}

function categoryFromIndex(category: number): BadgeVariant {
  return (["painting", "book", "film", "music", "other"][category] ?? "other") as BadgeVariant
}

function safeJsonParse(input: string): MetadataPayload | null {
  try {
    return JSON.parse(input) as MetadataPayload
  } catch {
    return null
  }
}

function decodeMetadataURI(metadataURI: string): MetadataPayload | null {
  if (!metadataURI.startsWith("data:application/json;base64,")) {
    return safeJsonParse(metadataURI)
  }

  const encoded = metadataURI.slice("data:application/json;base64,".length)
  try {
    return safeJsonParse(Buffer.from(encoded, "base64").toString("utf8"))
  } catch {
    return null
  }
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function toWork(input: {
  tokenId: bigint
  metadataURI: string
  creator: `0x${string}`
  category: number
  priceWei: bigint
  maxSupply: bigint
  activeAmount?: bigint
  sold: number
  listingId?: bigint
  creatorName?: string
}): DemoWork {
  const metadata = decodeMetadataURI(input.metadataURI)
  const supply = Number(input.maxSupply === 0n ? 0n : input.maxSupply)
  const title = metadata?.title?.trim() || `作品 #${input.tokenId.toString()}`
  const creatorName = metadata?.creatorName?.trim() || input.creatorName || shortenAddress(input.creator)

  return {
    tokenId: input.tokenId.toString(),
    title,
    description: metadata?.description?.trim() || "本地链演示作品",
    metadataURI: input.metadataURI,
    category: categoryFromIndex(input.category),
    coverImage: metadata?.coverImage?.trim() || DEFAULT_COVER,
    priceWei: input.priceWei.toString(),
    priceDisplay: `${Number(formatEther(input.priceWei)).toFixed(3)} ETH`,
    creator: {
      address: input.creator,
      shopName: creatorName,
    },
    supply,
    sold: input.sold,
    listingId: input.listingId?.toString(),
    availableAmount: input.activeAmount ? Number(input.activeAmount) : 0,
    royaltyBps: 0,
  }
}

export async function getDemoWorks() {
  const addresses = getAddresses()
  if (!addresses) return []

  const [mintLogs, listingLogs, soldLogs] = await Promise.all([
    publicClient.getLogs({
      address: addresses.CultureNFT,
      event: workMintedEvent,
      fromBlock: 0n,
      toBlock: "latest",
    }),
    publicClient.getLogs({
      address: addresses.Marketplace,
      event: itemListedEvent,
      fromBlock: 0n,
      toBlock: "latest",
    }),
    publicClient.getLogs({
      address: addresses.Marketplace,
      event: itemSoldEvent,
      fromBlock: 0n,
      toBlock: "latest",
    }),
  ])

  const parsedMintLogs = parseEventLogs({
    abi: CULTURE_NFT_ABI,
    eventName: "WorkMinted",
    logs: [...mintLogs] as any,
  })
  const parsedListingLogs = parseEventLogs({
    abi: MARKETPLACE_ABI,
    eventName: "ItemListed",
    logs: [...listingLogs] as any,
  })
  const parsedSoldLogs = parseEventLogs({
    abi: MARKETPLACE_ABI,
    eventName: "ItemSold",
    logs: [...soldLogs] as any,
  })

  const soldByListing = new Map<string, number>()
  for (const log of parsedSoldLogs) {
    const key = log.args.listingId?.toString()
    if (!key) continue
    soldByListing.set(key, (soldByListing.get(key) ?? 0) + Number(log.args.amount ?? 0n))
  }

  const latestListingByToken = new Map<string, { listingId: bigint; pricePerUnit: bigint; amount: bigint }>()
  for (const log of parsedListingLogs) {
    const listingId = log.args.listingId
    const tokenId = log.args.tokenId
    if (!listingId || !tokenId) continue

    const listing = await publicClient.readContract({
      address: addresses.Marketplace,
      abi: MARKETPLACE_ABI,
      functionName: "listings",
      args: [listingId],
    })

    const pricePerUnit = listing[2]
    const amount = listing[3]
    const active = listing[4]

    if (active) {
      latestListingByToken.set(tokenId.toString(), {
        listingId,
        pricePerUnit,
        amount,
      })
    }
  }

  const works = await Promise.all(
    parsedMintLogs.map(async (log) => {
      const tokenId = log.args.tokenId
      const metadataURI = log.args.metadataURI
      const creator = log.args.creator
      if (!tokenId || !metadataURI || !creator) return null

      const [workInfo, fallbackUri] = await Promise.all([
        publicClient.readContract({
          address: addresses.CultureNFT,
          abi: CULTURE_NFT_ABI,
          functionName: "getWorkInfo",
          args: [tokenId],
        }),
        publicClient.readContract({
          address: addresses.CultureNFT,
          abi: CULTURE_NFT_ABI,
          functionName: "uri",
          args: [tokenId],
        }),
      ])

      const listing = latestListingByToken.get(tokenId.toString())
      const royaltyBps = Number(workInfo.royaltyBps)
      const maxSupply = workInfo.maxSupply
      const category = Number(workInfo.category)
      const sold = listing
        ? soldByListing.get(listing.listingId.toString()) ?? 0
        : 0

      const work = toWork({
        tokenId,
        metadataURI: metadataURI || fallbackUri,
        creator,
        category,
        priceWei: listing?.pricePerUnit ?? 0n,
        maxSupply,
        activeAmount: listing?.amount,
        sold,
        listingId: listing?.listingId,
      })

      work.royaltyBps = royaltyBps
      return work
    })
  )

  return works.filter((work): work is DemoWork => Boolean(work)).reverse()
}

export async function getDemoWork(tokenId: string) {
  const works = await getDemoWorks()
  return works.find((work) => work.tokenId === tokenId) ?? null
}
