import Link from "next/link"
import { WorkCard } from "@/components/works/WorkCard"
import { MOCK_WORKS, MOCK_CATEGORIES_STATS } from "@/lib/mockData"
import { getDemoWorks } from "@/lib/demo-chain"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const demoWorks = await getDemoWorks()
  const featured = (demoWorks.length > 0 ? demoWorks : MOCK_WORKS).slice(0, 4)
  const stats = [
    { n: String(featured.length), label: "Works live" },
    { n: String(new Set(featured.map((work) => work.creator.address)).size), label: "Creators" },
    { n: String(featured.reduce((sum, work) => sum + work.sold, 0)), label: "Sales tracked" },
  ]

  return (
    <main className="pb-20">
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_48%,transparent_78%)]" />
        <div className="pointer-events-none absolute right-[-5rem] top-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute left-[-4rem] top-40 h-72 w-72 rounded-full bg-white/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-6 py-12 text-white shadow-[0_30px_120px_rgba(15,23,42,0.24)] sm:px-10 sm:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.35em] text-amber-300/90 sm:text-sm">
                Curated onchain culture
              </p>
              <h1 className="max-w-3xl text-5xl font-bold leading-[0.92] tracking-[-0.04em] sm:text-7xl">
                Mint work that
                <span className="mt-2 block bg-gradient-to-r from-amber-200 via-amber-400 to-orange-300 bg-clip-text text-transparent">
                  deserves a longer life.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                CultureChain turns paintings, books, films, and music into collectible digital editions
                with programmable royalties and a storefront that feels editorial, not technical.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/works"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-amber-400 px-8 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                >
                  Explore the marketplace
                </Link>
                <Link
                  href="/mint"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 text-sm font-semibold text-white transition hover:bg-white/16"
                >
                  Mint a new release
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">What stands out</p>
                <p className="mt-3 font-serif text-2xl text-white">A marketplace with gallery energy.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 text-center backdrop-blur">
                    <div className="text-2xl font-bold text-white sm:text-3xl">{s.n}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Browse by format</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Collect stories in more than one shape.
          </h2>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MOCK_CATEGORIES_STATS.map((cat) => (
            <Link
              key={cat.key}
              href={`/works?category=${cat.key}`}
              className="group rounded-[1.6rem] border border-white/70 bg-white/80 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-amber-200 hover:shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-4xl">{cat.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category</span>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-slate-950 group-hover:text-amber-700">
                {cat.label}
              </h3>
              <p className="mt-2 text-sm text-slate-500">{cat.count.toLocaleString()} works indexed</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Featured drop</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Works with momentum, not just metadata.
            </h2>
          </div>
          <Link href="/works" className="text-sm font-semibold text-slate-700 transition hover:text-amber-700">
            View all works
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((work, i) => (
            <WorkCard key={work.tokenId} work={work} priority={i < 2} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_65%,#f59e0b_180%)] px-6 py-12 text-white shadow-[0_26px_100px_rgba(15,23,42,0.22)] sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">For creators</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold sm:text-4xl">
                Publish a release that earns every time it moves.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Start with a simple mint flow, set a royalty rate, and open a storefront without
                dragging your collectors through a dense web3 workflow.
              </p>
            </div>
            <Link
              href="/mint"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-slate-950 transition hover:bg-amber-50"
            >
              Start minting
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
