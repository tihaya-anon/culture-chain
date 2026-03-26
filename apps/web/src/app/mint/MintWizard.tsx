"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { buildMockCoverImage, type MockWorkDetail } from "@/lib/mockData"
import { useDemoMarketStore } from "@/store/demo-market.store"

interface FormData {
  title: string
  description: string
  category: string
  tags: string
  coverFile: File | null
  contentFile: File | null
  price: string
  supply: string
  royalty: string
}

const INITIAL: FormData = {
  title: "",
  description: "",
  category: "",
  tags: "",
  coverFile: null,
  contentFile: null,
  price: "",
  supply: "1",
  royalty: "5",
}

const STEPS = ["Basics", "Files", "Pricing", "Review"]
const CATEGORIES: Array<{ value: MockWorkDetail["category"]; label: string }> = [
  { value: "painting", label: "🎨 Painting" },
  { value: "book", label: "📚 Book" },
  { value: "film", label: "🎬 Film" },
  { value: "music", label: "🎵 Music" },
  { value: "other", label: "✨ Other" },
]

export function MintWizard() {
  const mintWork = useDemoMarketStore((state) => state.mintWork)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [minting, setMinting] = useState(false)
  const [done, setDone] = useState<{ tokenId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (done) return <MintSuccess tokenId={done.tokenId} />

  function patch(update: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...update }))
  }

  async function handleMint() {
    setMinting(true)
    setError(null)

    try {
      const coverImage = await buildCoverPreview(form)
      const work = mintWork({
        title: form.title,
        description: form.description,
        category: categoryToValue(form.category),
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
        coverImage,
        coverFileName: form.coverFile?.name,
        contentFileName: form.contentFile?.name,
        priceWei: toWei(form.price),
        supply: Number(form.supply) || 0,
        royaltyBps: Math.round((Number(form.royalty) || 0) * 100),
      })

      setDone({ tokenId: work.tokenId })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Mint simulation failed. Please try again.")
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.10)]">
      <StepHeader current={step} />

      <div className="p-6 sm:p-8">
        {step === 0 && <Step1 form={form} patch={patch} />}
        {step === 1 && <Step2 form={form} patch={patch} />}
        {step === 2 && <Step3 form={form} patch={patch} />}
        {step === 3 && <Step4 form={form} minting={minting} />}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex justify-between gap-4 border-t border-stone-100 pt-6">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || minting}>
            Back
          </Button>
          {step < 3 ? (
            <Button
              variant="primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance(step, form)}
            >
              Continue
            </Button>
          ) : (
            <Button variant="primary" size="lg" loading={minting} onClick={handleMint}>
              Publish mock release
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepHeader({ current }: { current: number }) {
  return (
    <div className="border-b border-slate-100 bg-[#fffaf1] px-6 py-4">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`h-px w-6 sm:w-10 ${i <= current ? "bg-amber-400" : "bg-stone-200"}`} />}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${i < current
                  ? "bg-slate-950 text-white"
                  : i === current
                    ? "border-2 border-amber-500 bg-white text-amber-700"
                    : "bg-stone-200 text-stone-400"}`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span className={`hidden text-xs sm:inline ${i === current ? "font-semibold text-stone-800" : "text-stone-400"}`}>
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step1({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Release basics</SectionTitle>

      <Field label="Title" required>
        <input
          type="text"
          value={form.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Example: Between Mountains No. 3"
          maxLength={100}
          className={inputCls}
        />
      </Field>

      <Field label="Category" required>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => patch({ category: c.value })}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-all ${form.category === c.value
                ? "border-violet-400 bg-violet-50 text-violet-700"
                : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Description" hint="Give collectors context for the work.">
        <textarea
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Concept, material, release notes, or the story behind the piece."
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="Tags" hint="Comma-separated, up to five tags.">
        <input
          type="text"
          value={form.tags}
          onChange={(e) => patch({ tags: e.target.value })}
          placeholder="Ink, landscape, SSU"
          className={inputCls}
        />
      </Field>
    </div>
  )
}

function Step2({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Upload files</SectionTitle>
      <p className="text-sm text-stone-500">
        The cover is used for the static preview. The source file is referenced in mock metadata only and never leaves the browser.
      </p>

      <UploadZone
        label="Cover image"
        hint="JPG / PNG / WEBP, recommended 3:4, max 10MB."
        accept="image/jpeg,image/png,image/webp"
        file={form.coverFile}
        onChange={(f) => patch({ coverFile: f })}
        required
      />

      <UploadZone
        label="Source file"
        hint="High-res original, PDF, MP4, or audio file. Used only for local demo metadata."
        accept="image/*,application/pdf,video/mp4,audio/*"
        file={form.contentFile}
        onChange={(f) => patch({ contentFile: f })}
        required
      />
    </div>
  )
}

function UploadZone({
  label, hint, accept, file, onChange, required,
}: {
  label: string
  hint: string
  accept: string
  file: File | null
  onChange: (f: File) => void
  required?: boolean
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center transition-colors hover:border-amber-300 hover:bg-amber-50">
        {file ? (
          <>
            <span className="text-2xl">✅</span>
            <span className="text-sm font-medium text-stone-700">{file.name}</span>
            <span className="text-xs text-stone-400">{(file.size / 1024 / 1024).toFixed(2)} MB · click to replace</span>
          </>
        ) : (
          <>
            <span className="text-3xl text-stone-300">📎</span>
            <span className="text-sm font-medium text-stone-600">Click or drag to upload</span>
            <span className="text-xs text-stone-400">{hint}</span>
          </>
        )}
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
        />
      </label>
    </Field>
  )
}

function Step3({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  const price = parseFloat(form.price) || 0
  const royalty = parseFloat(form.royalty) || 0

  return (
    <div className="space-y-5">
      <SectionTitle>Pricing and royalties</SectionTitle>

      <Field label="Price (SSU)" required hint="Single-edition price paid by the collector in SSU.">
        <div className="relative">
          <input
            type="number"
            value={form.price}
            onChange={(e) => patch({ price: e.target.value })}
            placeholder="0.00"
            min="0"
            step="0.01"
            className={`${inputCls} pr-16`}
          />
          <span className="absolute right-4 top-2.5 text-sm font-medium text-stone-400">SSU</span>
        </div>
      </Field>

      <Field label="Edition size" required hint="Set to 0 for an open edition.">
        <input
          type="number"
          value={form.supply}
          onChange={(e) => patch({ supply: e.target.value })}
          min="0"
          max="10000"
          className={inputCls}
        />
      </Field>

      <Field label="Royalty (%)" required hint="Applied to every secondary sale in the mock metadata. Maximum 10%.">
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={form.royalty}
            onChange={(e) => patch({ royalty: e.target.value })}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-stone-400">
            <span>0%</span>
            <span className="font-semibold text-amber-700">{form.royalty}%</span>
            <span>10%</span>
          </div>
        </div>
      </Field>

      {price > 0 && (
        <div className="space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
          <p className="font-semibold text-stone-700">Revenue preview (primary sale)</p>
          <div className="flex justify-between text-stone-500">
            <span>Price</span>
            <span>{price.toFixed(4)} SSU</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Platform fee (2.5%)</span>
            <span>- {(price * 0.025).toFixed(4)} SSU</span>
          </div>
          <div className="h-px bg-stone-200" />
          <div className="flex justify-between font-semibold text-amber-700">
            <span>You receive</span>
            <span>{(price * 0.975).toFixed(4)} SSU</span>
          </div>
          <p className="text-xs text-stone-400">Secondary sales add another {royalty}% royalty stream in the static demo metadata.</p>
        </div>
      )}
    </div>
  )
}

function Step4({ form, minting }: { form: FormData; minting: boolean }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Review and publish</SectionTitle>

      <div className="overflow-hidden rounded-xl border border-stone-100 divide-y divide-stone-100">
        {[
          { label: "Title", value: form.title },
          { label: "Category", value: CATEGORIES.find((c) => c.value === form.category)?.label ?? "-" },
          { label: "Cover image", value: form.coverFile?.name ?? "Not selected" },
          { label: "Source file", value: form.contentFile?.name ?? "Not selected" },
          { label: "Price", value: `${form.price || "0"} SSU` },
          { label: "Edition size", value: Number(form.supply) === 0 ? "Open edition" : form.supply },
          { label: "Royalty", value: `${form.royalty}%` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-stone-500">{label}</span>
            <span className="font-medium text-stone-800">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="font-semibold">Before you publish</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-700">
          <li>You own the rights to the work or have permission to release it.</li>
          <li>The content follows platform policy and contains no restricted material.</li>
          <li>This action creates a browser-local mock release, not a live blockchain transaction.</li>
        </ul>
      </div>

      <p className="text-center text-xs text-stone-400">
        {minting ? "Saving metadata to local demo state..." : "This release will be available in the static demo and stored in this browser."}
      </p>
    </div>
  )
}

function MintSuccess({ tokenId }: { tokenId: string }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-stone-100 bg-white py-16 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">🎉</div>
      <h2 className="font-serif text-2xl font-bold text-stone-900">Release published</h2>
      <p className="text-stone-500">Your work is now available in the static demo catalog as token #{tokenId}.</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.assign(`../works/${tokenId}`)}>
          Open work
        </Button>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Mint another
        </Button>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="font-serif text-lg font-semibold text-stone-900">{children}</h2>
}

function Field({
  label, hint, required, children,
}: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-stone-700">
        {label}
        {required && <span className="ml-1 text-amber-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 " +
  "placeholder:text-stone-400 focus:border-amber-300 focus:bg-white focus:outline-none " +
  "focus:ring-2 focus:ring-amber-100 transition-all"

function canAdvance(step: number, form: FormData): boolean {
  if (step === 0) return !!form.title && !!form.category
  if (step === 1) return !!form.coverFile && !!form.contentFile
  if (step === 2) return !!form.price && parseFloat(form.price) > 0
  return true
}

function categoryToValue(category: string): MockWorkDetail["category"] {
  return CATEGORIES.find((item) => item.value === category)?.value ?? "other"
}

function toWei(value: string) {
  const [whole = "0", fraction = ""] = value.trim().split(".")
  const normalizedFraction = `${fraction}000000000000000000`.slice(0, 18)
  return `${BigInt(whole || "0") * 10n ** 18n + BigInt(normalizedFraction || "0")}`
}

async function buildCoverPreview(form: FormData) {
  if (!form.coverFile || !form.coverFile.type.startsWith("image/")) {
    return buildMockCoverImage(form.title, form.category)
  }

  return new Promise<string>((resolve, reject) => {
    const file = form.coverFile
    if (!file) {
      resolve(buildMockCoverImage(form.title, form.category))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : buildMockCoverImage(form.title, form.category))
    reader.onerror = () => reject(new Error("Could not read the cover image for the static preview."))
    reader.readAsDataURL(file)
  })
}
