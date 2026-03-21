import { Suspense } from "react"
import { WorkCard } from "@/components/works/WorkCard"
import { CategoryTabs } from "@/components/works/CategoryTabs"
import { MOCK_WORKS } from "@/lib/mockData"
import { getDemoWorks } from "@/lib/demo-chain"

interface WorksPageProps {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; page?: string }>
}

export function generateMetadata() {
  return { title: "探索作品" }
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
      {/* Page title */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          {category ? { painting:"画作", book:"书籍", film:"影视", music:"音乐" }[category] ?? "作品" : "全部作品"}
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          共 {works.length} 件作品
          {q && <span> · 搜索「{q}」</span>}
        </p>
      </div>

      {/* Filters */}
      <Suspense>
        <CategoryTabs />
      </Suspense>

      {/* Grid */}
      {works.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {works.map((work, i) => (
            <WorkCard key={work.tokenId} work={work} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-20 flex flex-col items-center gap-3 text-stone-400">
          <span className="text-5xl">🔍</span>
          <p className="font-semibold">没有找到相关作品</p>
          <p className="text-sm">试试换个关键词或分类</p>
        </div>
      )}
    </main>
  )
}
