import * as React from "react"

export type TxStatus = "pending" | "success" | "error"

export interface TxStatusToastProps {
  status: TxStatus
  txHash?: string
  message?: string
  explorerBaseUrl?: string
  onClose?: () => void
}

const STATUS_CONFIG = {
  pending: {
    icon: (
      <svg className="h-5 w-5 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
    bg: "bg-amber-50 border-amber-200",
    title: "交易处理中",
  },
  success: {
    icon: (
      <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    bg: "bg-emerald-50 border-emerald-200",
    title: "交易成功",
  },
  error: {
    icon: (
      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    bg: "bg-red-50 border-red-200",
    title: "交易失败",
  },
}

/** 交易状态 Toast — Web3 交互的三态反馈 */
export function TxStatusToast({
  status,
  txHash,
  message,
  explorerBaseUrl = "https://polygonscan.com/tx",
  onClose,
}: TxStatusToastProps) {
  const config = STATUS_CONFIG[status]

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg w-80 ${config.bg}`}
    >
      <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-900">{config.title}</p>
        {message && <p className="mt-0.5 text-xs text-stone-600">{message}</p>}
        {txHash && (
          <a
            href={`${explorerBaseUrl}/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-xs text-violet-600 hover:underline"
          >
            查看链上记录
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
      {onClose && status !== "pending" && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-stone-400 hover:text-stone-600"
          aria-label="关闭"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
