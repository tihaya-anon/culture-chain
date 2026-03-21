"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { waitForTransactionReceipt } from "wagmi/actions"
import { useAccount, useConfig } from "wagmi"
import { parseEventLogs } from "viem"
import { Button } from "@/components/ui/Button"
import { CULTURE_NFT_ABI, useListItem, useMintWork, useSetApprovalForAll } from "@culture-chain/sdk"

// ── Types ─────────────────────────────────────────────────────

interface FormData {
  // Step 1 — 基本信息
  title:       string
  description: string
  category:    string
  tags:        string
  // Step 2 — 文件
  coverFile:   File | null
  contentFile: File | null
  // Step 3 — 销售
  price:       string
  supply:      string
  royalty:     string
  // Step 4 — 确认
}

const INITIAL: FormData = {
  title: "", description: "", category: "", tags: "",
  coverFile: null, contentFile: null,
  price: "", supply: "1", royalty: "5",
}

const STEPS = ["基本信息", "上传文件", "销售设置", "确认发布"]
const CATEGORIES = [
  { value: "painting", label: "🎨 画作" },
  { value: "book",     label: "📚 书籍" },
  { value: "film",     label: "🎬 影视" },
  { value: "music",    label: "🎵 音乐" },
  { value: "other",    label: "✨ 其他" },
]

// ── Wizard ────────────────────────────────────────────────────

export function MintWizard() {
  const router = useRouter()
  const config = useConfig()
  const { isConnected } = useAccount()
  const { mintWorkAsync, address: nftAddress } = useMintWork()
  const { setApprovalForAllAsync } = useSetApprovalForAll()
  const { listItemAsync, address: marketplaceAddress } = useListItem()
  const [step, setStep]     = useState(0)
  const [form, setForm]     = useState<FormData>(INITIAL)
  const [minting, setMinting] = useState(false)
  const [done, setDone]     = useState<{ tokenId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const chainReady = useMemo(
    () => Boolean(nftAddress && marketplaceAddress),
    [marketplaceAddress, nftAddress]
  )

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-white p-10 text-center shadow-sm">
        <p className="text-4xl">🔗</p>
        <p className="mt-4 font-semibold text-stone-800">请先连接钱包</p>
        <p className="mt-2 text-sm text-stone-500">需要连接钱包才能发布作品</p>
      </div>
    )
  }

  if (!chainReady) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-8 text-center shadow-sm">
        <p className="text-3xl">⛓️</p>
        <p className="mt-4 font-semibold text-amber-900">本地合约还没部署</p>
        <p className="mt-2 text-sm text-amber-800">
          先启动 Hardhat 节点并执行 `pnpm contracts:deploy:local`，前端才会进入真实铸造流程。
        </p>
      </div>
    )
  }

  if (done) return <MintSuccess tokenId={done.tokenId} />

  function patch(update: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...update }))
  }

  async function handleMint() {
    setMinting(true)
    setError(null)
    try {
      const metadataURI = buildMetadataURI(form)
      const royaltyBps = Math.round(Number(form.royalty) * 100)
      const supply = BigInt(Number(form.supply) || 0)
      const category = categoryToIndex(form.category)
      const contentHash = await buildContentHash(form)

      const mintHash = await mintWorkAsync([
        metadataURI,
        BigInt(royaltyBps),
        supply,
        contentHash,
        category,
      ])
      const mintReceipt = await waitForTransactionReceipt(config, { hash: mintHash })
      const tokenId = extractTokenId(mintReceipt.logs)

      await waitForTransactionReceipt(config, {
        hash: await setApprovalForAllAsync(marketplaceAddress!, true),
      })

      await waitForTransactionReceipt(config, {
        hash: await listItemAsync(tokenId, form.price, supply === 0n ? 1n : supply),
      })

      setDone({ tokenId: tokenId.toString() })
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "链上交易失败，请重试")
    } finally {
      setMinting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
      {/* Progress */}
      <StepHeader current={step} />

      <div className="p-6 sm:p-8">
        {step === 0 && <Step1 form={form} patch={patch} />}
        {step === 1 && <Step2 form={form} patch={patch} />}
        {step === 2 && <Step3 form={form} patch={patch} />}
        {step === 3 && <Step4 form={form} minting={minting} onMint={handleMint} />}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Nav */}
        <div className="mt-8 flex justify-between gap-4 border-t border-stone-100 pt-6">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || minting}
          >
            ← 上一步
          </Button>
          {step < 3 ? (
            <Button
              variant="primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance(step, form)}
            >
              下一步 →
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              loading={minting}
              onClick={handleMint}
            >
              确认铸造
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step Header ───────────────────────────────────────────────

function StepHeader({ current }: { current: number }) {
  return (
    <div className="border-b border-stone-100 bg-stone-50 px-6 py-4">
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <div className={`h-px w-6 sm:w-10 ${i <= current ? "bg-violet-400" : "bg-stone-200"}`} />}
            <div className="flex items-center gap-1.5">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors
                  ${i < current  ? "bg-violet-600 text-white"
                  : i === current ? "border-2 border-violet-600 text-violet-700 bg-white"
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

// ── Step 1：基本信息 ──────────────────────────────────────────

function Step1({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>作品基本信息</SectionTitle>

      <Field label="作品名称" required>
        <input
          type="text"
          value={form.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="例：山水之间 No.3"
          maxLength={100}
          className={inputCls}
        />
      </Field>

      <Field label="分类" required>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => patch({ category: c.value })}
              className={`rounded-xl border py-2.5 text-sm font-medium transition-all
                ${form.category === c.value
                  ? "border-violet-400 bg-violet-50 text-violet-700"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="作品描述" hint="向买家介绍这件作品">
        <textarea
          value={form.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="创作背景、材质、尺幅、获奖经历…"
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Field label="标签" hint="用逗号分隔，最多 5 个">
        <input
          type="text"
          value={form.tags}
          onChange={(e) => patch({ tags: e.target.value })}
          placeholder="水墨, 山水, 原创"
          className={inputCls}
        />
      </Field>
    </div>
  )
}

// ── Step 2：上传文件 ──────────────────────────────────────────

function Step2({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>上传作品文件</SectionTitle>
      <p className="text-sm text-stone-500">
        封面图将公开展示，正文文件加密存储，仅 NFT 持有者可下载。
      </p>

      <UploadZone
        label="封面图"
        hint="JPG / PNG / WEBP，建议 3:4 比例，最大 10MB"
        accept="image/jpeg,image/png,image/webp"
        file={form.coverFile}
        onChange={(f) => patch({ coverFile: f })}
        required
      />

      <UploadZone
        label="正文文件"
        hint="画作可上传高清原图；书籍上传 PDF；视频上传 MP4，最大 500MB"
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
  label: string; hint: string; accept: string; file: File | null
  onChange: (f: File) => void; required?: boolean
}) {
  return (
    <Field label={label} hint={hint} required={required}>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl
                        border-2 border-dashed border-stone-200 bg-stone-50 p-8 text-center
                        transition-colors hover:border-violet-300 hover:bg-violet-50">
        {file ? (
          <>
            <span className="text-2xl">✅</span>
            <span className="text-sm font-medium text-stone-700">{file.name}</span>
            <span className="text-xs text-stone-400">
              {(file.size / 1024 / 1024).toFixed(2)} MB · 点击替换
            </span>
          </>
        ) : (
          <>
            <span className="text-3xl text-stone-300">📎</span>
            <span className="text-sm font-medium text-stone-600">点击或拖拽上传</span>
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

// ── Step 3：销售设置 ──────────────────────────────────────────

function Step3({ form, patch }: { form: FormData; patch: (u: Partial<FormData>) => void }) {
  const price   = parseFloat(form.price) || 0
  const royalty = parseFloat(form.royalty) || 0

  return (
    <div className="space-y-5">
      <SectionTitle>销售设置</SectionTitle>

      <Field label="售价（MATIC）" required hint="买家支付的单价">
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
          <span className="absolute right-4 top-2.5 text-sm font-medium text-stone-400">MATIC</span>
        </div>
      </Field>

      <Field label="发行数量" required hint="设为 0 表示不限量">
        <input
          type="number"
          value={form.supply}
          onChange={(e) => patch({ supply: e.target.value })}
          min="0"
          max="10000"
          className={inputCls}
        />
      </Field>

      <Field label="版税率 (%)" required hint="二级市场每次转售，你将自动获得的版税比例（最高 10%）">
        <div className="space-y-2">
          <input
            type="range"
            min="0" max="10" step="0.5"
            value={form.royalty}
            onChange={(e) => patch({ royalty: e.target.value })}
            className="w-full accent-violet-600"
          />
          <div className="flex justify-between text-xs text-stone-400">
            <span>0%</span>
            <span className="font-semibold text-violet-700">{form.royalty}%</span>
            <span>10%</span>
          </div>
        </div>
      </Field>

      {/* Preview */}
      {price > 0 && (
        <div className="rounded-xl bg-stone-50 p-4 text-sm space-y-2">
          <p className="font-semibold text-stone-700">收益预览（首次销售）</p>
          <div className="flex justify-between text-stone-500">
            <span>售价</span>
            <span>{price.toFixed(4)} MATIC</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>平台手续费 (2.5%)</span>
            <span>- {(price * 0.025).toFixed(4)} MATIC</span>
          </div>
          <div className="h-px bg-stone-200" />
          <div className="flex justify-between font-semibold text-violet-700">
            <span>你实际到手</span>
            <span>{(price * 0.975).toFixed(4)} MATIC</span>
          </div>
          <p className="text-xs text-stone-400">
            二级市场转售时你还将额外获得 {royalty}% 版税
          </p>
        </div>
      )}
    </div>
  )
}

// ── Step 4：确认发布 ──────────────────────────────────────────

function Step4({
  form, minting, onMint,
}: { form: FormData; minting: boolean; onMint: () => void }) {
  return (
    <div className="space-y-5">
      <SectionTitle>确认发布信息</SectionTitle>

      <div className="divide-y divide-stone-100 rounded-xl border border-stone-100 overflow-hidden">
        {[
          { label: "作品名称",   value: form.title },
          { label: "分类",       value: CATEGORIES.find(c => c.value === form.category)?.label ?? "-" },
          { label: "封面图",     value: form.coverFile?.name ?? "未选择" },
          { label: "正文文件",   value: form.contentFile?.name ?? "未选择" },
          { label: "售价",       value: `${form.price || "0"} MATIC` },
          { label: "发行数量",   value: Number(form.supply) === 0 ? "不限量" : form.supply },
          { label: "版税率",     value: `${form.royalty}%` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-stone-500">{label}</span>
            <span className="font-medium text-stone-800">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
        <p className="font-semibold">发布前请确认：</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-amber-700">
          <li>作品版权归你所有，不侵犯他人知识产权</li>
          <li>内容符合平台规范，不含违规内容</li>
          <li>链上操作不可撤销，确认无误再提交</li>
        </ul>
      </div>

      <p className="text-xs text-stone-400 text-center">
        预计 Gas 费用 &lt; 0.01 MATIC · 铸造到 Polygon 网络
      </p>
    </div>
  )
}

function MintSuccess({ tokenId }: { tokenId: string }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-stone-100 bg-white py-16 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        🎉
      </div>
      <h2 className="font-serif text-2xl font-bold text-stone-900">作品发布成功！</h2>
      <p className="text-stone-500">你的作品已铸造并上架，Token ID 为 #{tokenId}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => window.location.href = `/works/${tokenId}`}>
          查看作品详情
        </Button>
        <Button variant="primary" onClick={() => window.location.reload()}>
          继续发布
        </Button>
      </div>
    </div>
  )
}

// ── Shared UI ─────────────────────────────────────────────────

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
        {required && <span className="ml-1 text-violet-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  )
}

const inputCls =
  "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 " +
  "placeholder:text-stone-400 focus:border-violet-300 focus:bg-white focus:outline-none " +
  "focus:ring-2 focus:ring-violet-100 transition-all"

function canAdvance(step: number, form: FormData): boolean {
  if (step === 0) return !!form.title && !!form.category
  if (step === 1) return !!form.coverFile && !!form.contentFile
  if (step === 2) return !!form.price && parseFloat(form.price) > 0
  return true
}

function categoryToIndex(category: string) {
  return Math.max(CATEGORIES.findIndex((item) => item.value === category), 0)
}

async function buildContentHash(form: FormData) {
  const payload = form.contentFile
    ? await form.contentFile.arrayBuffer()
    : new TextEncoder().encode(`${form.title}:${Date.now()}`)
  const digest = await crypto.subtle.digest("SHA-256", payload)
  const hex = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
  return `sha256:${hex}`
}

function buildMetadataURI(form: FormData) {
  const payload = {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5),
    creatorName: "Local Creator",
    coverImage: buildCoverImage(form.title.trim(), form.category),
    files: {
      cover: form.coverFile?.name ?? null,
      content: form.contentFile?.name ?? null,
    },
  }

  return `data:application/json;base64,${btoa(unescape(encodeURIComponent(JSON.stringify(payload))))}`
}

function buildCoverImage(title: string, category: string) {
  const label = title || "CultureChain"
  const accent =
    category === "painting" ? "#fb7185" :
    category === "book" ? "#f59e0b" :
    category === "film" ? "#38bdf8" :
    category === "music" ? "#8b5cf6" :
    "#78716c"

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">
      <rect width="800" height="1000" fill="#1f1637" />
      <circle cx="640" cy="220" r="170" fill="${accent}" opacity="0.85" />
      <circle cx="160" cy="840" r="220" fill="#ffffff" opacity="0.08" />
      <rect x="64" y="88" width="672" height="824" rx="42" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
      <text x="96" y="170" fill="white" font-size="36" font-family="Arial, sans-serif">CultureChain Local Demo</text>
      <text x="96" y="720" fill="white" font-size="72" font-family="Georgia, serif">${escapeSvg(label.slice(0, 28))}</text>
      <text x="96" y="790" fill="rgba(255,255,255,0.72)" font-size="28" font-family="Arial, sans-serif">${escapeSvg(category || "other")}</text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

function escapeSvg(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function extractTokenId(logs: readonly { topics: readonly string[]; data: `0x${string}` }[]) {
  const [event] = parseEventLogs({
    abi: CULTURE_NFT_ABI,
    eventName: "WorkMinted",
    logs: [...logs] as any,
  })

  if (!event?.args.tokenId) {
    throw new Error("未能从交易回执中解析 tokenId")
  }

  return event.args.tokenId
}
