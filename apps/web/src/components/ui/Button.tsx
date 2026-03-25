"use client"

import { type ButtonHTMLAttributes, type ReactNode } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children: ReactNode
}

const base = "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

const variants = {
  primary:   "bg-slate-950 text-white hover:bg-slate-800 active:scale-95 shadow-sm hover:shadow-md",
  secondary: "border border-slate-300 bg-white/80 text-slate-900 hover:bg-amber-50 active:scale-95",
  ghost:     "text-slate-600 hover:bg-white/70 active:scale-95",
  danger:    "bg-red-600 text-white hover:bg-red-700 active:scale-95",
}

const sizes = {
  sm: "h-8  px-4  text-sm",
  md: "h-10 px-6  text-sm",
  lg: "h-12 px-8  text-base",
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
