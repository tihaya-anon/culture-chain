import Link from "next/link"
import { WorkCard } from "@/components/works/WorkCard"
import { MOCK_WORKS, MOCK_CATEGORIES_STATS } from "@/lib/mockData"

export default function HomePage() {
  const featured = MOCK_WORKS.slice(0, 4)

  return (
    <main>
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-violet-700 to-indigo-800 px-6 pb-24 pt-20 text-white">
        {/* 背景装饰圆 */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-500/20" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* 设计亮点：用中英双语排版彰显文化感 */}
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.25em] text-violet-300">
            Culture · Chain · Creation
          </p>
          <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            让每件文化作品
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
              永远属于你
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-violet-100">
            区块链确权 · 版税自动分配 · 永久存储
            <br />
            画作、书籍、影视、音乐，在这里铸造你的作品
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/works"
              className="rounded-full bg-white px-8 py-3.5 text-base font-semibold
                         text-violet-800 shadow-lg transition hover:bg-amber-50 hover:shadow-xl active:scale-95"
            >
              探索作品
            </Link>
            <Link
              href="/mint"
              className="rounded-full border border-white/40 bg-white/10 px-8 py-3.5
                         text-base font-semibold text-white backdrop-blur-sm
                         transition hover:bg-white/20 active:scale-95"
            >
              + 发布作品
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-sm grid-cols-3 gap-4 sm:max-w-none sm:grid-cols-3">
            {[
              { n: "3,497", label: "件作品" },
              { n: "1,200+", label: "位创作者" },
              { n: "9,800+", label: "笔成交" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-white sm:text-3xl">{s.n}</div>
                <div className="mt-0.5 text-sm text-violet-300">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
          按分类浏览
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOCK_CATEGORIES_STATS.map((cat) => (
            <Link
              key={cat.key}
              href={`/works?category=${cat.key}`}
              className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-100
                         bg-white py-8 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-100
                         hover:shadow-lg hover:shadow-violet-100/50"
            >
              <span className="text-4xl">{cat.icon}</span>
              <span className="font-semibold text-stone-800 group-hover:text-violet-700">
                {cat.label}
              </span>
              <span className="text-xs text-stone-400">{cat.count.toLocaleString()} 件作品</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured Works ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl font-semibold text-stone-900 sm:text-3xl">
            精选作品
          </h2>
          <Link
            href="/works"
            className="text-sm font-medium text-violet-600 hover:text-violet-800"
          >
            查看全部 →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((work, i) => (
            <WorkCard key={work.tokenId} work={work} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────── */}
      <section className="bg-stone-900 px-6 py-16 text-center text-white">
        <h2 className="font-serif text-3xl font-bold sm:text-4xl">
          你也是创作者
        </h2>
        <p className="mx-auto mt-4 max-w-md text-stone-400">
          无需懂区块链，像开咸鱼店一样简单。
          将你的作品铸造为 NFT，开始赚取永久版税。
        </p>
        <Link
          href="/mint"
          className="mt-8 inline-block rounded-full bg-amber-400 px-10 py-3.5 text-base
                     font-bold text-stone-900 shadow-lg transition hover:bg-amber-300 active:scale-95"
        >
          立即开店，免费发布
        </Link>
      </section>
    </main>
  )
}
