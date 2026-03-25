import { MintWizard } from "./MintWizard"

export const metadata = { title: "Mint" }

export default function MintPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Creator studio</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-950 sm:text-5xl">Mint a new cultural release</h1>
        <p className="mt-3 text-base text-slate-600">
          Prepare the listing, set pricing and royalties, then publish it straight to the demo chain.
        </p>
      </div>
      <MintWizard />
    </main>
  )
}
