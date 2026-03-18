"use client"

import { useRouter, useSearchParams } from "next/navigation"

const TABS = [
  { value: "",         label: "全部" },
  { value: "painting", label: "画作" },
  { value: "book",     label: "书籍" },
  { value: "film",     label: "影视" },
  { value: "music",    label: "音乐" },
  { value: "other",    label: "其他" },
]

const SORT_OPTIONS = [
  { value: "newest",     label: "最新" },
  { value: "popular",    label: "热门" },
  { value: "price_asc",  label: "价格↑" },
  { value: "price_desc", label: "价格↓" },
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
    next.delete("page") // 切分类时重置到第 1 页
    router.push(`/works?${next.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => navigate("category", tab.value)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
              ${category === tab.value
                ? "bg-violet-700 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => navigate("sort", e.target.value)}
        className="h-9 rounded-full border border-stone-200 bg-white px-3 text-sm
                   text-stone-600 focus:border-violet-300 focus:outline-none focus:ring-2
                   focus:ring-violet-100 sm:w-28"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
