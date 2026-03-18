import type { Metadata } from "next"
import { Providers } from "./providers"
import { Navbar } from "@/components/layout/Navbar"
import "@culture-chain/ui/globals.css"

export const metadata: Metadata = {
  title: {
    template: "%s | CultureChain",
    default: "CultureChain — Web3 文化作品交易平台",
  },
  description: "用区块链守护创作价值，让文化作品自由流转。买卖画作、书籍、影视、音乐数字作品。",
  keywords: ["NFT", "文化作品", "数字艺术", "Web3", "版权"],
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "CultureChain",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-stone-50 text-stone-900">
        <Providers>
          <Navbar />
          <div className="animate-fade-in">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
