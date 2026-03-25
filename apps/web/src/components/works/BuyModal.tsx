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
        throw new Error("This work does not have an active listing.")
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
      const msg = err instanceof Error ? err.message : "Transaction failed. Please try again."
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
      <div className="w-full max-w-md animate-slide-up rounded-t-3xl border border-white/60 bg-[#fffcf7] p-6 shadow-2xl sm:rounded-2xl">

        {/* ── Confirm ─────────────────────────────────────── */}
        {status === "confirm" && (
          <>
            <h2 className="text-xl font-bold text-slate-950">Confirm purchase</h2>
            <p className="mt-1 text-sm text-slate-500">Review the order details before you sign.</p>

            <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <Row label="Work" value={work.title} bold />
              <Row label="Quantity" value={`${amount} edition${amount > 1 ? "s" : ""}`} />
              <div className="h-px bg-slate-200" />
              <Row label="Price" value={`${work.priceDisplay} × ${amount}`} />
              <Row label="Platform fee (2.5%)" value={feeDisp} />
              <div className="h-px bg-slate-200" />
              <Row label="Total" value={totalDisp} bold accent />
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Royalties are distributed automatically on secondary sales. By purchasing, you agree
              to the platform terms for this demo environment.
            </p>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" className="flex-1" onClick={handleBuy}>
                Confirm
              </Button>
            </div>
          </>
        )}

        {/* ── Pending ─────────────────────────────────────── */}
        {status === "pending" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
            <p className="font-semibold text-slate-800">Transaction pending</p>
            <p className="text-center text-sm text-slate-500">
              Confirm the request in your wallet. Onchain confirmation may take 10 to 30 seconds.
            </p>
          </div>
        )}

        {/* ── Success ─────────────────────────────────────── */}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckIcon className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-slate-950">Purchase complete</p>
            <p className="text-center text-sm text-slate-500">
              {work.title} has been transferred to your wallet.
            </p>
            {txHash && (
              <a
                href={`http://127.0.0.1:8545`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-address text-xs text-amber-700 hover:underline"
              >
                Tx hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </a>
            )}
            <Button variant="primary" className="mt-2 w-full" onClick={onClose}>
              Close
            </Button>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <XIcon className="h-7 w-7 text-red-500" />
            </div>
            <p className="font-semibold text-slate-900">Transaction failed</p>
            <p className="text-center text-sm text-slate-500">{errorMsg}</p>
            <div className="flex w-full gap-3">
              <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStatus("confirm")}>Try again</Button>
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
      <span className="text-slate-500">{label}</span>
      <span className={`${bold ? "font-semibold" : ""} ${accent ? "text-amber-700" : "text-slate-800"}`}>
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
