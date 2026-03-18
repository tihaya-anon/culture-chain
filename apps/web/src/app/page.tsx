export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="bg-brand-gradient px-6 py-24 text-center text-white">
        <h1 className="font-serif text-5xl font-bold leading-tight tracking-tight">
          文化作品，链上确权
        </h1>
        <p className="mt-4 text-lg text-violet-100">
          发现、购买、收藏独一无二的数字文化作品
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/works"
            className="rounded-full bg-white px-8 py-3 font-semibold text-violet-700 shadow transition hover:bg-violet-50"
          >
            探索作品
          </a>
          <a
            href="/mint"
            className="rounded-full border border-white/60 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            发布作品
          </a>
        </div>
      </section>

      {/* 作品列表占位 */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-serif text-3xl font-semibold text-stone-900">精选作品</h2>
        <p className="mt-2 text-stone-500">正在加载...</p>
      </section>
    </main>
  )
}
