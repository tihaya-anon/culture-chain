import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

// ── Fixture ────────────────────────────────────────────────────────────────

async function deployCultureNFTFixture() {
  const [owner, creator, buyer, other] = await ethers.getSigners()

  const CultureNFT = await ethers.getContractFactory("CultureNFT")
  const nft = await CultureNFT.deploy(owner.address)
  await nft.waitForDeployment()

  // 常用铸造参数
  const DEFAULT_URI          = "ipfs://QmMetadata123"
  const DEFAULT_ROYALTY_BPS  = 500n  // 5%
  const DEFAULT_SUPPLY       = 10n
  const DEFAULT_CONTENT_HASH = "sha256:abc123def456"
  const DEFAULT_CATEGORY     = 0     // Painting

  return {
    nft, owner, creator, buyer, other,
    DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY,
    DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY,
  }
}

/** 铸造一个作品并返回 tokenId（从事件中提取） */
async function mintOne(
  nft: Awaited<ReturnType<typeof deployCultureNFTFixture>>["nft"],
  creator: Awaited<ReturnType<typeof deployCultureNFTFixture>>["creator"],
  overrides: {
    uri?: string
    royaltyBps?: bigint
    supply?: bigint
    contentHash?: string
    category?: number
  } = {}
) {
  const tx = await nft.connect(creator).mint(
    overrides.uri          ?? "ipfs://QmMeta",
    overrides.royaltyBps   ?? 500n,
    overrides.supply       ?? 10n,
    overrides.contentHash  ?? "sha256:unique_hash",
    overrides.category     ?? 0
  )
  const receipt = await tx.wait()
  const event = receipt!.logs
    .map((log) => { try { return nft.interface.parseLog(log) } catch { return null } })
    .find((e) => e?.name === "WorkMinted")
  return event!.args.tokenId as bigint
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CultureNFT", () => {

  // ── mint() ──────────────────────────────────────────────────────────────

  describe("mint()", () => {

    it("铸造成功：tokenId 从 1 递增", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      const tokenId1 = await mintOne(nft, creator, { contentHash: "sha256:hash_a" })
      const tokenId2 = await mintOne(nft, creator, { contentHash: "sha256:hash_b" })

      expect(tokenId1).to.equal(1n)
      expect(tokenId2).to.equal(2n)
    })

    it("铸造成功：创作者持有正确数量的 NFT", async () => {
      const { nft, creator, DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY } =
        await loadFixture(deployCultureNFTFixture)

      await nft.connect(creator).mint(
        DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY
      )

      const balance = await nft.balanceOf(creator.address, 1n)
      expect(balance).to.equal(DEFAULT_SUPPLY)
    })

    it("supply=0 时：铸造 1 份给创作者（所有权凭证）", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await nft.connect(creator).mint("ipfs://meta", 500n, 0n, "sha256:hash_zero_supply", 0)

      const balance = await nft.balanceOf(creator.address, 1n)
      expect(balance).to.equal(1n)
    })

    it("铸造成功：uri() 返回正确的 metadataURI", async () => {
      const { nft, creator, DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY } =
        await loadFixture(deployCultureNFTFixture)

      await nft.connect(creator).mint(
        DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY
      )

      expect(await nft.uri(1n)).to.equal(DEFAULT_URI)
    })

    it("铸造成功：getWorkInfo() 返回完整作品信息", async () => {
      const { nft, creator, DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY } =
        await loadFixture(deployCultureNFTFixture)

      await nft.connect(creator).mint(
        DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY
      )

      const info = await nft.getWorkInfo(1n)
      expect(info.creator).to.equal(creator.address)
      expect(info.royaltyBps).to.equal(DEFAULT_ROYALTY_BPS)
      expect(info.maxSupply).to.equal(DEFAULT_SUPPLY)
      expect(info.contentHash).to.equal(DEFAULT_CONTENT_HASH)
      expect(info.category).to.equal(DEFAULT_CATEGORY)
    })

    it("铸造成功：触发 WorkMinted 事件，参数正确", async () => {
      const { nft, creator, DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY } =
        await loadFixture(deployCultureNFTFixture)

      await expect(
        nft.connect(creator).mint(
          DEFAULT_URI, DEFAULT_ROYALTY_BPS, DEFAULT_SUPPLY, DEFAULT_CONTENT_HASH, DEFAULT_CATEGORY
        )
      )
        .to.emit(nft, "WorkMinted")
        .withArgs(1n, creator.address, DEFAULT_SUPPLY, DEFAULT_URI)
    })

    // ── 版税率校验 ───────────────────────────────────────────

    it("[Security] 版税率 = 1000 (10%)：通过（边界值）", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await expect(
        nft.connect(creator).mint("ipfs://meta", 1000n, 5n, "sha256:hash_max_royalty", 0)
      ).not.to.be.reverted
    })

    it("[Security] 版税率 > 1000 (>10%)：revert RoyaltyTooHigh", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await expect(
        nft.connect(creator).mint("ipfs://meta", 1001n, 5n, "sha256:hash_over_royalty", 0)
      )
        .to.be.revertedWithCustomError(nft, "RoyaltyTooHigh")
        .withArgs(1001n, 1000n)
    })

    it("[Security] 版税率 = 0：通过（创作者放弃版税）", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await expect(
        nft.connect(creator).mint("ipfs://meta", 0n, 5n, "sha256:hash_zero_royalty", 0)
      ).not.to.be.reverted
    })

    // ── contentHash 校验 ─────────────────────────────────────

    it("[Security] 重复 contentHash：revert ContentHashAlreadyRegistered", async () => {
      const { nft, creator, other } = await loadFixture(deployCultureNFTFixture)
      const HASH = "sha256:duplicate_hash"

      // 第一次铸造
      await nft.connect(creator).mint("ipfs://meta1", 500n, 5n, HASH, 0)

      // 另一个账户尝试用相同 hash 铸造
      await expect(
        nft.connect(other).mint("ipfs://meta2", 300n, 3n, HASH, 1)
      )
        .to.be.revertedWithCustomError(nft, "ContentHashAlreadyRegistered")
        .withArgs(HASH, 1n)
    })

    it("[Security] 空 contentHash：revert EmptyContentHash", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await expect(
        nft.connect(creator).mint("ipfs://meta", 500n, 5n, "", 0)
      ).to.be.revertedWithCustomError(nft, "EmptyContentHash")
    })

    it("[Security] 合约暂停时铸造：revert EnforcedPause", async () => {
      const { nft, owner, creator } = await loadFixture(deployCultureNFTFixture)

      await nft.connect(owner).pause()

      await expect(
        nft.connect(creator).mint("ipfs://meta", 500n, 5n, "sha256:paused_hash", 0)
      ).to.be.revertedWithCustomError(nft, "EnforcedPause")
    })
  })

  // ── royaltyInfo() ───────────────────────────────────────────────────────

  describe("royaltyInfo()", () => {

    it("返回正确的版税金额（ERC-2981）", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)
      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, "sha256:royalty_test", 0)

      const salePrice = ethers.parseEther("1.0")   // 1 MATIC
      const [receiver, royaltyAmount] = await nft.royaltyInfo(1n, salePrice)

      expect(receiver).to.equal(creator.address)
      // 5% of 1 MATIC = 0.05 MATIC
      expect(royaltyAmount).to.equal(ethers.parseEther("0.05"))
    })

    it("版税接收方为铸造时的创作者地址", async () => {
      const { nft, creator, other } = await loadFixture(deployCultureNFTFixture)
      // creator 铸造后转给 other，版税接收方应仍为 creator
      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, "sha256:royalty_creator", 0)
      await nft.connect(creator).safeTransferFrom(creator.address, other.address, 1n, 5n, "0x")

      const [receiver] = await nft.royaltyInfo(1n, ethers.parseEther("1"))
      expect(receiver).to.equal(creator.address)
    })
  })

  // ── verifyContent() ─────────────────────────────────────────────────────

  describe("verifyContent()", () => {

    it("未注册的 hash 返回 0", async () => {
      const { nft } = await loadFixture(deployCultureNFTFixture)

      expect(await nft.verifyContent("sha256:nonexistent")).to.equal(0n)
    })

    it("铸造后可通过 contentHash 查到 tokenId", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)
      const HASH = "sha256:verified_content"

      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, HASH, 0)

      expect(await nft.verifyContent(HASH)).to.equal(1n)
    })

    it("不同作品的 hash 互不干扰", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)
      const HASH_A = "sha256:work_a"
      const HASH_B = "sha256:work_b"

      await nft.connect(creator).mint("ipfs://meta_a", 500n, 5n, HASH_A, 0)
      await nft.connect(creator).mint("ipfs://meta_b", 300n, 3n, HASH_B, 1)

      expect(await nft.verifyContent(HASH_A)).to.equal(1n)
      expect(await nft.verifyContent(HASH_B)).to.equal(2n)
    })
  })

  // ── burn() ──────────────────────────────────────────────────────────────

  describe("burn()", () => {

    it("创作者可以销毁自己的 NFT", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)
      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, "sha256:burn_test", 0)

      await expect(nft.connect(creator).burn(1n, 3n))
        .to.emit(nft, "WorkBurned")
        .withArgs(1n, creator.address, 3n)

      expect(await nft.balanceOf(creator.address, 1n)).to.equal(7n)
    })

    it("[Security] 非创作者销毁：revert NotCreator", async () => {
      const { nft, creator, other } = await loadFixture(deployCultureNFTFixture)
      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, "sha256:burn_not_creator", 0)
      // 转一些给 other，但 other 仍不是"creator"
      await nft.connect(creator).safeTransferFrom(creator.address, other.address, 1n, 5n, "0x")

      await expect(nft.connect(other).burn(1n, 1n))
        .to.be.revertedWithCustomError(nft, "NotCreator")
        .withArgs(other.address, creator.address)
    })
  })

  // ── pause / unpause ─────────────────────────────────────────────────────

  describe("pause() / unpause()", () => {

    it("[Security] 非 Owner 不能暂停合约", async () => {
      const { nft, creator } = await loadFixture(deployCultureNFTFixture)

      await expect(nft.connect(creator).pause())
        .to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount")
    })

    it("暂停后恢复，铸造正常", async () => {
      const { nft, owner, creator } = await loadFixture(deployCultureNFTFixture)

      await nft.connect(owner).pause()
      await nft.connect(owner).unpause()

      await expect(
        nft.connect(creator).mint("ipfs://meta", 500n, 5n, "sha256:after_unpause", 0)
      ).not.to.be.reverted
    })
  })

  // ── supportsInterface() ─────────────────────────────────────────────────

  describe("supportsInterface()", () => {

    it("支持 ERC-1155 接口 (0xd9b67a26)", async () => {
      const { nft } = await loadFixture(deployCultureNFTFixture)
      expect(await nft.supportsInterface("0xd9b67a26")).to.be.true
    })

    it("支持 ERC-2981 版税接口 (0x2a55205a)", async () => {
      const { nft } = await loadFixture(deployCultureNFTFixture)
      expect(await nft.supportsInterface("0x2a55205a")).to.be.true
    })
  })
})
