/**
 * 开发阶段用 mock 数据，上线前替换为真实 API 调用
 */
import type { Work } from "@/components/works/WorkCard"

export const MOCK_WORKS: Work[] = [
  {
    tokenId: "1",
    title: "山水之间 No.3",
    category: "painting",
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=533&fit=crop",
    priceWei: "1000000000000000000",
    priceDisplay: "1.0 MATIC",
    creator: { address: "0x1234", shopName: "水墨工坊" },
    supply: 10, sold: 3,
  },
  {
    tokenId: "2",
    title: "孤独星球：旅行者之书",
    category: "book",
    coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=533&fit=crop",
    priceWei: "500000000000000000",
    priceDisplay: "0.5 MATIC",
    creator: { address: "0x2345", shopName: "纸上星球" },
    supply: 100, sold: 47,
  },
  {
    tokenId: "3",
    title: "城市独白 — 纪录片",
    category: "film",
    coverImage: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=533&fit=crop",
    priceWei: "2000000000000000000",
    priceDisplay: "2.0 MATIC",
    creator: { address: "0x3456", shopName: "独立影像" },
    supply: 50, sold: 12,
  },
  {
    tokenId: "4",
    title: "月下即兴 EP",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=533&fit=crop",
    priceWei: "800000000000000000",
    priceDisplay: "0.8 MATIC",
    creator: { address: "0x4567", shopName: "弦外之音" },
    supply: 200, sold: 200,
  },
  {
    tokenId: "5",
    title: "霓虹城市 No.7",
    category: "painting",
    coverImage: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=533&fit=crop",
    priceWei: "1500000000000000000",
    priceDisplay: "1.5 MATIC",
    creator: { address: "0x5678", shopName: "城市光影" },
    supply: 5, sold: 2,
  },
  {
    tokenId: "6",
    title: "深夜书房：哲学随笔集",
    category: "book",
    coverImage: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=533&fit=crop",
    priceWei: "600000000000000000",
    priceDisplay: "0.6 MATIC",
    creator: { address: "0x6789", shopName: "深夜书房" },
    supply: 300, sold: 88,
  },
  {
    tokenId: "7",
    title: "云端之上 OST",
    category: "music",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=533&fit=crop",
    priceWei: "1200000000000000000",
    priceDisplay: "1.2 MATIC",
    creator: { address: "0x7890", shopName: "声音织物" },
    supply: 0, sold: 0,
  },
  {
    tokenId: "8",
    title: "失语者的庭院",
    category: "film",
    coverImage: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=533&fit=crop",
    priceWei: "3000000000000000000",
    priceDisplay: "3.0 MATIC",
    creator: { address: "0x8901", shopName: "庭院影视" },
    supply: 20, sold: 5,
  },
]

export const MOCK_CATEGORIES_STATS = [
  { key: "painting", label: "画作", count: 1240, icon: "🎨" },
  { key: "book",     label: "书籍", count: 867,  icon: "📚" },
  { key: "film",     label: "影视", count: 432,  icon: "🎬" },
  { key: "music",    label: "音乐", count: 958,  icon: "🎵" },
]
