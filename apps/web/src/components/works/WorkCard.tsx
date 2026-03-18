"use client"

import Link from "next/link"
import Image from "next/image"
import { Badge, CATEGORY_LABELS, type BadgeVariant } from "@/components/ui/Badge"

export interface Work {
  tokenId: string
  title: string
  category: BadgeVariant
  coverImage: string
  priceWei: string
  priceDisplay: string
  creator: {
    address: string
    shopName: string
    avatar?: string
  }
  supply: number
  sold: number
}

interface WorkCardProps {
  work: Work
  priority?: boolean
}

export function WorkCard({ work, priority = false }: WorkCardProps) {
  const soldOut = work.supply > 0 && work.sold >= work.supply
  const remaining = work.supply > 0 ? work.supply - work.sold : null

  return (
    <Link
      href={`/works/${work.tokenId}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white
                 border border-stone-100 shadow-sm
                 transition-all duration-300
                 hover:-translate-y-1 hover:shadow-xl hover:border-stone-200"
    >
      {/* Cover image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
        <Image
          src={work.coverImage}
          alt={work.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />

        {/* Category badge overlay */}
        <div className="absolute left-3 top-3">
          <Badge variant={work.category}>
            {CATEGORY_LABELS[work.category] ?? work.category}
          </Badge>
        </div>

        {/* Sold out overlay */}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-stone-500 shadow">
              已售罄
            </span>
          </div>
        )}

        {/* Quick buy — appears on hover */}
        {!soldOut && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full p-3
                          transition-transform duration-300 group-hover:translate-y-0">
            <div className="rounded-xl bg-violet-700 py-2 text-center text-sm font-semibold text-white shadow-lg">
              立即购买
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-3">
        {/* Creator */}
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full bg-stone-200">
            {work.creator.avatar && (
              <Image
                src={work.creator.avatar}
                alt={work.creator.shopName}
                width={20}
                height={20}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <span className="truncate text-xs text-stone-500">{work.creator.shopName}</span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-serif text-sm font-semibold leading-snug text-stone-900
                       group-hover:text-violet-700 transition-colors">
          {work.title}
        </h3>

        {/* Price + stock */}
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-sm font-bold text-violet-700">{work.priceDisplay}</span>
          {remaining !== null && !soldOut && (
            <span className="text-xs text-stone-400">剩余 {remaining}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
