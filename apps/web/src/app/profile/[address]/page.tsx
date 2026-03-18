import Image from "next/image"
import { WorkCard } from "@/components/works/WorkCard"
import { MOCK_WORKS } from "@/lib/mockData"

interface ProfilePageProps {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { address } = await params
  return { title: `${address.slice(0, 8)}… 的店铺` }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params

  // TODO: 替换为真实 API 调用
  const creatorWorks = MOCK_WORKS.filter((w) => w.creator.address === address)
  const shopName     = creatorWorks[0]?.creator.shopName ?? `${address.slice(0, 6)}…的店铺`
  const totalSold    = creatorWorks.reduce((s, w) => s + w.sold, 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Banner */}
      <div className="relative mb-6 h-40 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 to-indigo-800 sm:h-52">
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex items-end gap-4">
            {/* Avatar placeholder */}
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-violet-200 shadow-lg">
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-violet-600">
                {shopName[0]}
              </div>
            </div>
            <div className="mb-1">
              <h1 className="font-serif text-2xl font-bold text-white">{shopName}</h1>
              <p className="font-address text-xs text-violet-300">
                {address.slice(0, 8)}…{address.slice(-6)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "作品数",   value: creatorWorks.length },
          { label: "已售出",   value: totalSold },
          { label: "收藏者数", value: Math.floor(totalSold * 1.3) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-stone-100 bg-white py-5 text-center shadow-sm">
            <div className="text-2xl font-bold text-violet-700">{s.value}</div>
            <div className="mt-0.5 text-xs text-stone-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Works */}
      <h2 className="mb-4 font-serif text-xl font-semibold text-stone-900">
        发布的作品
      </h2>
      {creatorWorks.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {creatorWorks.map((work) => (
            <WorkCard key={work.tokenId} work={work} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-100 bg-white py-16 text-center text-stone-400">
          <p className="text-4xl">🎨</p>
          <p className="mt-3 font-semibold">还没有发布作品</p>
          <p className="mt-1 text-sm">发布第一件作品，开始赚取版税</p>
        </div>
      )}
    </main>
  )
}
