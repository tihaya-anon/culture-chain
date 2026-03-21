import Image from "next/image"
import { notFound } from "next/navigation"
import { Badge, CATEGORY_LABELS } from "@/components/ui/Badge"
import { WorkDetailActions } from "./WorkDetailActions"
import { MOCK_WORKS } from "@/lib/mockData"
import { getDemoWork } from "@/lib/demo-chain"

interface WorkDetailPageProps {
  params: Promise<{ tokenId: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: WorkDetailPageProps) {
  const { tokenId } = await params
  const work = await getDemoWork(tokenId) ?? MOCK_WORKS.find((w) => w.tokenId === tokenId)
  return { title: work?.title ?? "作品详情" }
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { tokenId } = await params
  const work = await getDemoWork(tokenId) ?? MOCK_WORKS.find((w) => w.tokenId === tokenId)
  if (!work) notFound()

  const soldOut    = work.supply > 0 && work.sold >= work.supply
  const remaining  = work.supply > 0 ? work.supply - work.sold : null
  const soldPct    = work.supply > 0 ? Math.round((work.sold / work.supply) * 100) : 0

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_420px]">

        {/* ── 左：作品展示 ──────────────────────────────────── */}
        <div className="space-y-6">
          {/* Cover */}
          <div className="relative aspect-[4/5] max-h-[600px] w-full overflow-hidden rounded-2xl bg-stone-100 shadow-lg sm:aspect-[3/4]">
            <Image
              src={work.coverImage}
              alt={work.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>

          {/* 交易历史（占位） */}
          <div className="rounded-2xl border border-stone-100 bg-white p-5">
            <h3 className="font-semibold text-stone-800">交易历史</h3>
            <p className="mt-3 text-sm text-stone-400">暂无交易记录</p>
          </div>
        </div>

        {/* ── 右：详情 & 购买 ───────────────────────────────── */}
        <div className="space-y-5">
          {/* Badge + Title */}
          <div>
            <Badge variant={work.category}>
              {CATEGORY_LABELS[work.category] ?? work.category}
            </Badge>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-stone-900">
              {work.title}
            </h1>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 p-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-stone-200">
              {work.creator.avatar && (
                <Image
                  src={work.creator.avatar}
                  alt={work.creator.shopName}
                  width={40} height={40}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-stone-400">创作者</p>
              <p className="truncate font-semibold text-stone-800">{work.creator.shopName}</p>
            </div>
            <span className="ml-auto font-address text-xs text-stone-400">
              {work.creator.address.slice(0, 6)}…{work.creator.address.slice(-4)}
            </span>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-stone-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-stone-500">当前价格</p>
            <p className="mt-1 text-4xl font-bold text-violet-700">{work.priceDisplay}</p>

            {/* Supply progress */}
            {work.supply > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-stone-500">
                  <span>已售 {work.sold}/{work.supply}</span>
                  <span>{soldPct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-violet-400 transition-all"
                    style={{ width: `${soldPct}%` }}
                  />
                </div>
                {remaining !== null && !soldOut && (
                  <p className="mt-1 text-xs text-stone-400">仅剩 {remaining} 份</p>
                )}
              </div>
            )}

            {/* 购买按钮（客户端交互，抽出为独立组件） */}
            <WorkDetailActions work={work} soldOut={soldOut || !work.listingId} />
          </div>

          {/* NFT Info */}
          <div className="rounded-2xl border border-stone-100 bg-white p-5 space-y-3 text-sm">
            <h3 className="font-semibold text-stone-800">链上信息</h3>
            <InfoRow label="Token ID" value={`#${work.tokenId}`} mono />
            <InfoRow label="标准" value="ERC-1155" />
            <InfoRow label="区块链" value="Hardhat Local" />
            <InfoRow label="版税" value={formatRoyalty(work as { royaltyBps?: unknown })} />
          </div>
        </div>
      </div>
    </main>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-500">{label}</span>
      <span className={`text-stone-800 ${mono ? "font-address" : ""}`}>{value}</span>
    </div>
  )
}

function formatRoyalty(work: { royaltyBps?: unknown }) {
  return typeof work.royaltyBps === "number" ? `${work.royaltyBps / 100}%` : "5%"
}
