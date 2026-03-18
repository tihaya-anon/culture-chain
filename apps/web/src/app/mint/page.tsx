import { MintWizard } from "./MintWizard"

export const metadata = { title: "发布作品" }

export default function MintPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-stone-900">发布你的作品</h1>
        <p className="mt-2 text-stone-500">
          完成以下步骤，将作品铸造为 NFT，开始获得版税收益
        </p>
      </div>
      <MintWizard />
    </main>
  )
}
