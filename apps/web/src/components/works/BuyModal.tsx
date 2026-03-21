"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { waitForTransactionReceipt } from "wagmi/actions"
import { useConfig } from "wagmi"
import { Button } from "@/components/ui/Button"
import { useBuyItem } from "@culture-chain/sdk"
import type { Work } from "./WorkCard"

type TxStatus = "idle" | "confirm" | "pending" | "success" | "error"

interface BuyModalProps {
  work: Work
  amount?: number
  onClose: () => void
}

export function BuyModal({ work, amount = 1, onClose }: BuyModalProps) {
  const router = useRouter()
  const config = useConfig()
  const { buyItemAsync } = useBuyItem()
  const [status, setStatus] = useState<TxStatus>("confirm")
  const [txHash, setTxHash] = useState<string>()
  const [errorMsg, setErrorMsg] = useState<string>()

  const totalWei  = BigInt(work.priceWei) * BigInt(amount)
  const feeWei    = (totalWei * 25n) / 1000n            // 2.5%
  const totalDisp = formatMatic(totalWei)
  const feeDisp   = formatMatic(feeWei)

  async function handleBuy() {
    setStatus("pending")
    try {
      if (!work.listingId) {
        throw new Error("当前作品没有可购买的上架单")
      }

      const hash = await buyItemAsync(
        BigInt(work.listingId),
        BigInt(amount),
        BigInt(work.priceWei)
      )
      await waitForTransactionReceipt(config, { hash })
      setTxHash(hash)
      setStatus("success")
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "交易失败，请重试"
      setErrorMsg(msg)
      setStatus("error")
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && status !== "pending" && onClose()}
    >
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl">

        {/* ── Confirm ─────────────────────────────────────── */}
        {status === "confirm" && (
          <>
            <h2 className="font-serif text-xl font-bold text-stone-900">确认购买</h2>
            <p className="mt-1 text-sm text-stone-500">请仔细核对以下信息</p>

            <div className="mt-5 rounded-xl border border-stone-100 bg-stone-50 p-4 space-y-3">
              <Row label="作品" value={work.title} bold />
              <Row label="购买数量" value={`${amount} 份`} />
              <div className="h-px bg-stone-200" />
              <Row label="作品价格" value={`${work.priceDisplay} × ${amount}`} />
              <Row label="平台手续费 (2.5%)" value={feeDisp} />
              <div className="h-px bg-stone-200" />
              <Row label="合计" value={totalDisp} bold accent />
            </div>

            <p className="mt-3 text-xs text-stone-400">
              版税将在二级市场流通时自动分配给创作者。购买即表示你同意平台服务条款。
            </p>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                取消
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleBuy}>
                确认购买
              </Button>
            </div>
          </>
        )}

        {/* ── Pending ─────────────────────────────────────── */}
        {status === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-stone-200 border-t-violet-600" />
            <p className="font-semibold text-stone-800">交易处理中</p>
            <p className="text-center text-sm text-stone-500">
              请在钱包中确认交易，链上确认可能需要 10–30 秒
            </p>
          </div>
        )}

        {/* ── Success ─────────────────────────────────────── */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-serif text-xl font-bold text-stone-900">购买成功！</p>
            <p className="text-center text-sm text-stone-500">
              《{work.title}》已转入你的钱包
            </p>
            {txHash && (
              <a
                href={`http://127.0.0.1:8545`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-address text-xs text-violet-600 hover:underline"
              >
                交易哈希：{txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            )}
            <Button variant="primary" className="mt-2 w-full" onClick={onClose}>
              关闭
            </Button>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <XIcon className="h-7 w-7 text-red-500" />
            </div>
            <p className="font-semibold text-stone-900">交易失败</p>
            <p className="text-center text-sm text-stone-500">{errorMsg}</p>
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose}>取消</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStatus("confirm")}>重试</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  label, value, bold, accent,
}: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${accent ? "text-violet-700" : "text-stone-800"}`}>
        {value}
      </span>
    </div>
  )
}

function formatMatic(wei: bigint) {
  const value = Number(wei) / 1e18
  return `${value.toFixed(4)} ETH`
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function XIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
