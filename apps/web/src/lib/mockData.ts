/**
 * Mock data for the current demo flow. Replace with real reads before launch.
 */
import type { Work } from "@/components/works/WorkCard"

export const MOCK_WORKS: Work[] = [
  {
    tokenId: "1",
    title: "Between Mountains No. 3",
    category: "painting",
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=533&fit=crop",
    priceWei: "1000000000000000000",
    priceDisplay: "1.0 ETH",
    creator: { address: "0x1234", shopName: "Ink Atelier" },
    supply: 10, sold: 3,
  },
  {
    tokenId: "2",
    title: "Lonely Planet: Traveller's Ledger",
    category: "book",
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=533&fit=crop",
    priceWei: "500000000000000000",
    priceDisplay: "0.5 ETH",
    creator: { address: "0x2345", shopName: "Paper Planet" },
    supply: 100, sold: 47,
  },
  {
    tokenId: "3",
    title: "City Soliloquy",
    category: "film",
    coverImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=533&fit=crop",
    priceWei: "2000000000000000000",
    priceDisplay: "2.0 ETH",
    creator: { address: "0x3456", shopName: "Indie Frames" },
    supply: 50, sold: 12,
  },
  {
    tokenId: "4",
    title: "Moonlit Improvisations EP",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=533&fit=crop",
    priceWei: "800000000000000000",
    priceDisplay: "0.8 ETH",
    creator: { address: "0x4567", shopName: "String Theory" },
    supply: 200, sold: 200,
  },
  {
    tokenId: "5",
    title: "Neon City No. 7",
    category: "painting",
    coverImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=533&fit=crop",
    priceWei: "1500000000000000000",
    priceDisplay: "1.5 ETH",
    creator: { address: "0x5678", shopName: "Urban Light" },
    supply: 5, sold: 2,
  },
  {
    tokenId: "6",
    title: "Midnight Reading Room",
    category: "book",
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=533&fit=crop",
    priceWei: "600000000000000000",
    priceDisplay: "0.6 ETH",
    creator: { address: "0x6789", shopName: "After Hours Press" },
    supply: 300, sold: 88,
  },
  {
    tokenId: "7",
    title: "Above the Clouds OST",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=533&fit=crop",
    priceWei: "1200000000000000000",
    priceDisplay: "1.2 ETH",
    creator: { address: "0x7890", shopName: "Sound Weave" },
    supply: 0, sold: 0,
  },
  {
    tokenId: "8",
    title: "Garden of the Speechless",
    category: "film",
    coverImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=533&fit=crop",
    priceWei: "3000000000000000000",
    priceDisplay: "3.0 ETH",
    creator: { address: "0x8901", shopName: "Courtyard Films" },
    supply: 20, sold: 5,
  },
]

export const MOCK_CATEGORIES_STATS = [
  { key: "painting", label: "Painting", count: 1240, icon: "🎨" },
  { key: "book",     label: "Books", count: 867,  icon: "📚" },
  { key: "film",     label: "Film", count: 432,  icon: "🎬" },
  { key: "music",    label: "Music", count: 958,  icon: "🎵" },
]
