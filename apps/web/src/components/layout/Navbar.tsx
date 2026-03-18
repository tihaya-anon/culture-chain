"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

const CATEGORIES = [
  { label: "画作", href: "/works?category=painting" },
  { label: "书籍", href: "/works?category=book" },
  { label: "影视", href: "/works?category=film" },
  { label: "音乐", href: "/works?category=music" },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="mr-2 flex-shrink-0 font-serif text-xl font-bold text-violet-700 tracking-tight"
        >
          CultureChain
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors
                ${pathname === c.href
                  ? "bg-violet-50 text-violet-700"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"}`}
            >
              {c.label}
            </Link>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Desktop search */}
        <div className="hidden md:block">
          <div className="relative">
            <input
              type="search"
              placeholder="搜索作品、创作者..."
              className="h-9 w-56 rounded-full border border-stone-200 bg-stone-50 pl-9 pr-4 text-sm
                         text-stone-800 placeholder:text-stone-400
                         focus:border-violet-300 focus:bg-white focus:outline-none focus:ring-2
                         focus:ring-violet-100 transition-all duration-200 lg:w-72"
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          </div>
        </div>

        {/* Mobile search toggle */}
        <button
          className="rounded-full p-2 text-stone-500 hover:bg-stone-100 md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="搜索"
        >
          <SearchIcon className="h-5 w-5" />
        </button>

        {/* 发布作品 */}
        <Link
          href="/mint"
          className="hidden rounded-full border border-violet-200 px-4 py-1.5 text-sm
                     font-medium text-violet-700 transition hover:bg-violet-50 sm:block"
        >
          + 发布
        </Link>

        {/* Wallet */}
        <ConnectButton
          accountStatus="avatar"
          chainStatus="none"
          showBalance={false}
        />

        {/* Mobile menu toggle */}
        <button
          className="rounded-full p-2 text-stone-500 hover:bg-stone-100 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          {menuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="border-t border-stone-100 px-4 py-3 md:hidden">
          <div className="relative">
            <input
              type="search"
              placeholder="搜索作品、创作者..."
              className="h-10 w-full rounded-full border border-stone-200 bg-stone-50 pl-10 pr-4 text-sm
                         focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
              autoFocus
            />
            <SearchIcon className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
          </div>
        </div>
      )}

      {/* Mobile nav menu */}
      {menuOpen && (
        <div className="border-t border-stone-100 bg-white px-4 pb-4 md:hidden">
          <nav className="mt-3 grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl border border-stone-100 px-4 py-3 text-sm
                           font-medium text-stone-700 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                {c.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/mint"
            onClick={() => setMenuOpen(false)}
            className="mt-3 block w-full rounded-full bg-violet-700 py-2.5 text-center
                       text-sm font-semibold text-white"
          >
            + 发布作品
          </Link>
        </div>
      )}
    </header>
  )
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
    </svg>
  )
}

function MenuIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
