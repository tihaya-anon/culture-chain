import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/Navbar"
import "@culture-chain/ui/globals.css"

// Web3 providers（wagmi + RainbowKit）在 SSR 阶段跳过：
// 1. 钱包状态天然是客户端概念，SSR 无意义
// 2. RainbowKit 在 build 时会因缺少真实 projectId 而抛错
const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false }
)

export const metadata: Metadata = {
  title: {
    template: "%s | CultureChain",
    default: "CultureChain | Onchain Culture Marketplace",
  },
  description: "Discover, mint, and trade digital culture across art, books, film, and music.",
  keywords: ["NFT", "digital culture", "art marketplace", "Web3", "royalties"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "CultureChain",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen text-slate-950">
        <Providers>
          <Navbar />
          <div className="animate-fade-in relative">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
