import { Suspense } from "react"
import { WorkCard } from "@/components/works/WorkCard"
import { CategoryTabs } from "@/components/works/CategoryTabs"
import { MOCK_WORKS } from "@/lib/mockData"
import { getDemoWorks } from "@/lib/demo-chain"

interface WorksPageProps {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; page?: string }>
}

export function generateMetadata() {
  return { title: "Marketplace" }
}

export const dynamic = "force-dynamic"

export default async function WorksPage({ searchParams }: WorksPageProps) {
  const { category, q } = await searchParams

  const demoWorks = await getDemoWorks()
  const works = (demoWorks.length > 0 ? demoWorks : MOCK_WORKS).filter((w) => {
    if (category && w.category !== category) return false
    if (q && !w.title.includes(q) && !w.creator.shopName.includes(q)) return false
    return true
  })

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Marketplace</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950 sm:text-5xl">
          {category ? { painting:"Painting", book:"Books", film:"Film", music:"Music", other:"Other" }[category] ?? "Works" : "All works"}
        </h1>
        <p className="mt-3 text-base text-slate-600">
          {works.length} works available
          {q && <span> · Search query: "{q}"</span>}
        </p>
      </div>

      <div className="mt-6">
        <Suspense>
          <CategoryTabs />
        </Suspense>
      </div>

      {works.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {works.map((work, i) => (
            <WorkCard key={work.tokenId} work={work} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-20 flex flex-col items-center gap-3 rounded-[1.75rem] border border-white/60 bg-white/70 py-16 text-slate-400 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <span className="text-5xl">🔍</span>
          <p className="font-semibold text-slate-700">No matching works found</p>
          <p className="text-sm">Try a different category or search phrase.</p>
        </div>
      )}
    </main>
  )
}
