"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/Button"
import { BuyModal } from "@/components/works/BuyModal"
import type { Work } from "@/components/works/WorkCard"

export function WorkDetailActions({ work, soldOut }: { work: Work; soldOut: boolean }) {
  const { isConnected } = useAccount()
  const [showBuy, setShowBuy] = useState(false)

  if (soldOut) {
    return (
      <div className="mt-5 rounded-xl bg-stone-100 py-3 text-center text-sm font-semibold text-stone-400">
        已售罄
      </div>
    )
  }

  return (
    <>
      <div className="mt-5 flex gap-3">
        {isConnected ? (
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => setShowBuy(true)}
          >
            立即购买
          </Button>
        ) : (
          <div className="flex-1 rounded-full bg-stone-100 py-3 text-center text-sm font-semibold text-stone-500">
            连接钱包后购买
          </div>
        )}
      </div>

      {showBuy && (
        <BuyModal work={work} onClose={() => setShowBuy(false)} />
      )}
    </>
  )
}
