"use client"

import { useRouter, useSearchParams } from "next/navigation"

const TABS = [
  { value: "",         label: "All" },
  { value: "painting", label: "Painting" },
  { value: "book",     label: "Books" },
  { value: "film",     label: "Film" },
  { value: "music",    label: "Music" },
  { value: "other",    label: "Other" },
]

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "popular",    label: "Popular" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
]

export function CategoryTabs() {
  const router     = useRouter()
  const params     = useSearchParams()
  const category   = params.get("category") ?? ""
  const sort       = params.get("sort") ?? "newest"

  function navigate(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete("page")
    router.push(`/works?${next.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate("category", tab.value)}
            className={`min-h-11 flex-shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200
              ${category === tab.value
                ? "bg-slate-950 text-white shadow-sm"
                : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white hover:text-slate-950"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => navigate("sort", e.target.value)}
        className="h-11 rounded-full border border-slate-200 bg-white/80 px-4 text-sm
                   text-slate-600 focus:border-amber-300 focus:outline-none focus:ring-2
                   focus:ring-amber-100 sm:w-48"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
