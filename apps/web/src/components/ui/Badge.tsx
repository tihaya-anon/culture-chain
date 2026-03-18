"use client"

import { type ReactNode } from "react"

const variants = {
  painting: "bg-rose-100 text-rose-700",
  book:     "bg-amber-100 text-amber-700",
  film:     "bg-blue-100  text-blue-700",
  music:    "bg-violet-100 text-violet-700",
  other:    "bg-stone-100 text-stone-600",
  verified: "bg-emerald-100 text-emerald-700",
  pending:  "bg-yellow-100 text-yellow-700",
  sold:     "bg-stone-100 text-stone-400",
} as const

export type BadgeVariant = keyof typeof variants

export const CATEGORY_LABELS: Record<string, string> = {
  painting: "画作",
  book:     "书籍",
  film:     "影视",
  music:    "音乐",
  other:    "其他",
}

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  className?: string
}

export function Badge({ variant = "other", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
