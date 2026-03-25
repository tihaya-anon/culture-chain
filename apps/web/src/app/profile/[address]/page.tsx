import { WorkCard } from "@/components/works/WorkCard"
import { MOCK_WORKS } from "@/lib/mockData"

interface ProfilePageProps {
  params: Promise<{ address: string }>
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { address } = await params
  return { title: `${address.slice(0, 8)}… Storefront` }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = await params

  const creatorWorks = MOCK_WORKS.filter((w) => w.creator.address === address)
  const shopName     = creatorWorks[0]?.creator.shopName ?? `${address.slice(0, 6)}… Studio`
  const totalSold    = creatorWorks.reduce((s, w) => s + w.sold, 0)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative mb-6 h-48 overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#f59e0b_180%)] shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:h-60">
        <div className="absolute inset-0 flex items-end p-6">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-4 border-white bg-amber-100 shadow-lg">
              <div className="flex h-full w-full items-center justify-center font-serif text-2xl text-amber-700">
                {shopName[0]}
              </div>
            </div>
            <div className="mb-1">
              <h1 className="font-serif text-2xl font-bold text-white">{shopName}</h1>
              <p className="font-address text-xs text-slate-300">
                {address.slice(0, 8)}…{address.slice(-6)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          { label: "Works", value: creatorWorks.length },
          { label: "Sold", value: totalSold },
          { label: "Collectors", value: Math.floor(totalSold * 1.3) },
        ].map((s) => (
          <div key={s.label} className="rounded-[1.4rem] border border-white/60 bg-white/80 py-5 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <div className="text-2xl font-bold text-slate-950">{s.value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{s.label}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-2xl font-semibold text-slate-950">
        Published works
      </h2>
      {creatorWorks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creatorWorks.map((work) => (
            <WorkCard key={work.tokenId} work={work} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-white/60 bg-white/70 py-16 text-center text-slate-400 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <p className="text-4xl">🎨</p>
          <p className="mt-3 font-semibold text-slate-700">No published works yet</p>
          <p className="mt-1 text-sm">Mint the first release and start collecting royalties.</p>
        </div>
      )}
    </main>
  )
}
