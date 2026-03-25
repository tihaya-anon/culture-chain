"use client"

import { type ReactNode } from "react"

const variants = {
  painting: "bg-rose-100 text-rose-700",
  book:     "bg-amber-100 text-amber-800",
  film:     "bg-sky-100 text-sky-800",
  music:    "bg-indigo-100 text-indigo-800",
  other:    "bg-slate-100 text-slate-700",
  verified: "bg-emerald-100 text-emerald-700",
  pending:  "bg-yellow-100 text-yellow-700",
  sold:     "bg-slate-100 text-slate-500",
} as const

export type BadgeVariant = keyof typeof variants

export const CATEGORY_LABELS: Record<string, string> = {
  painting: "Painting",
  book:     "Book",
  film:     "Film",
  music:    "Music",
  other:    "Other",
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
