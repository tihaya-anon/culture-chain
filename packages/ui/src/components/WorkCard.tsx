import * as React from "react"

export interface WorkCardProps {
  tokenId: string
  title: string
  category: "painting" | "book" | "film" | "music" | "other"
  coverImage: string
  priceDisplay: string
  creator: {
    address: string
    shopName: string
    avatar?: string
  }
  supply: number
  sold: number
  onClick?: () => void
}

const CATEGORY_LABELS: Record<WorkCardProps["category"], string> = {
  painting: "Painting",
  book: "Book",
  film: "Film",
  music: "Music",
  other: "Other",
}

const CATEGORY_COLORS: Record<WorkCardProps["category"], string> = {
  painting: "bg-violet-100 text-violet-700",
  book: "bg-blue-100 text-blue-700",
  film: "bg-amber-100 text-amber-700",
  music: "bg-emerald-100 text-emerald-700",
  other: "bg-stone-100 text-stone-600",
}

export function WorkCard({
  title,
  category,
  coverImage,
  priceDisplay,
  creator,
  supply,
  sold,
  onClick,
}: WorkCardProps) {
  const remaining = supply - sold
  const soldOutPercent = supply > 0 ? Math.round((sold / supply) * 100) : 0

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white border border-stone-200 card-hover cursor-pointer"
    >
      {/* 封面图 */}
      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* 分类标签 */}
        <span
          className={`absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[category]}`}
        >
          {CATEGORY_LABELS[category]}
        </span>
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* 标题 */}
        <h3 className="font-semibold text-stone-900 line-clamp-2 text-sm leading-snug">
          {title}
        </h3>

        {/* 创作者 */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-stone-200 overflow-hidden flex-shrink-0">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.shopName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                {creator.shopName[0]}
              </div>
            )}
          </div>
          <span className="text-xs text-stone-500 truncate">{creator.shopName}</span>
        </div>

        {/* 底部：价格 + 销量 */}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-xs text-stone-400">Price</p>
            <p className="text-base font-bold text-violet-700">{priceDisplay}</p>
          </div>
          {supply > 0 && (
            <div className="text-right">
              <p className="text-xs text-stone-400">{remaining}/{supply} left</p>
              <div className="mt-1 h-1 w-16 rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${soldOutPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
