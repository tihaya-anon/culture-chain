import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

// ── Helpers ────────────────────────────────────────────────────────────────

const ONE_MATIC = ethers.parseEther("1.0")
const PRICE     = ONE_MATIC           // 每份 1 MATIC
const AMOUNT    = 5n                  // 上架 5 份

/** 解析成交后各方的费用（与合约 _splitPayment 逻辑保持一致） */
function calcSplit(totalPrice: bigint, royaltyBps: bigint, platformBps: bigint) {
  const platformFee  = (totalPrice * platformBps) / 10000n
  const royalty      = (totalPrice * royaltyBps)  / 10000n
  const sellerAmount = totalPrice - platformFee - royalty
  return { platformFee, royalty, sellerAmount }
}

// ── Fixture ────────────────────────────────────────────────────────────────

async function deployMarketplaceFixture() {
  const [owner, feeRecipient, creator, buyer, other] = await ethers.getSigners()

  // 部署 NFT 合约
  const CultureNFT = await ethers.getContractFactory("CultureNFT")
  const nft = await CultureNFT.deploy(owner.address)
  await nft.waitForDeployment()

  // 部署市场合约
  const Marketplace = await ethers.getContractFactory("Marketplace")
  const market = await Marketplace.deploy(
    await nft.getAddress(),
    feeRecipient.address,
    owner.address
  )
  await market.waitForDeployment()

  return { nft, market, owner, feeRecipient, creator, buyer, other }
}

/** 完整的铸造 + 授权 + 上架 Fixture（省略重复代码） */
async function deployWithListingFixture() {
  const base = await deployMarketplaceFixture()
  const { nft, market, creator } = base

  const ROYALTY_BPS = 500n  // 5%
  const TOKEN_SUPPLY = 10n

  // 铸造
  await nft.connect(creator).mint(
    "ipfs://QmMeta",
    ROYALTY_BPS,
    TOKEN_SUPPLY,
    "sha256:listing_hash",
    0
  )

  // 授权市场合约
  await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

  // 上架 5 份，每份 1 MATIC
  const tx = await market.connect(creator).listItem(1n, PRICE, AMOUNT)
  const receipt = await tx.wait()
  const event = receipt!.logs
    .map((log) => { try { return market.interface.parseLog(log) } catch { return null } })
    .find((e) => e?.name === "ItemListed")
  const listingId = event!.args.listingId as bigint

  return { ...base, listingId, ROYALTY_BPS, TOKEN_SUPPLY }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Marketplace", () => {

  // ── listItem() ──────────────────────────────────────────────────────────

  describe("listItem()", () => {

    it("上架成功：触发 ItemListed 事件，参数正确", async () => {
      const { nft, market, creator } = await loadFixture(deployMarketplaceFixture)

      await nft.connect(creator).mint("ipfs://meta", 500n, 10n, "sha256:list_test", 0)
      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

      await expect(market.connect(creator).listItem(1n, PRICE, AMOUNT))
        .to.emit(market, "ItemListed")
        .withArgs(1n, 1n, creator.address, PRICE, AMOUNT)
    })

    it("上架成功：listing 数据正确写入", async () => {
      const { listingId, market, creator } = await loadFixture(deployWithListingFixture)

      const listing = await market.listings(listingId)
      expect(listing.seller).to.equal(creator.address)
      expect(listing.tokenId).to.equal(1n)
      expect(listing.pricePerUnit).to.equal(PRICE)
      expect(listing.amount).to.equal(AMOUNT)
      expect(listing.active).to.be.true
    })

    it("不同作品可重复上架，listingId 递增", async () => {
      const { nft, market, creator } = await loadFixture(deployMarketplaceFixture)

      await nft.connect(creator).mint("ipfs://meta_a", 500n, 10n, "sha256:list_a", 0)
      await nft.connect(creator).mint("ipfs://meta_b", 300n, 8n,  "sha256:list_b", 1)
      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

      await market.connect(creator).listItem(1n, PRICE, 5n)
      await market.connect(creator).listItem(2n, PRICE * 2n, 3n)

      expect((await market.listings(1n)).tokenId).to.equal(1n)
      expect((await market.listings(2n)).tokenId).to.equal(2n)
    })
  })

  // ── delistItem() ────────────────────────────────────────────────────────

  describe("delistItem()", () => {

    it("卖家可以下架，listing.active 变为 false", async () => {
      const { market, creator, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(creator).delistItem(listingId)
      const listing = await market.listings(listingId)

      expect(listing.active).to.be.false
    })

    it("下架成功：触发 ItemDelisted 事件", async () => {
      const { market, creator, listingId } = await loadFixture(deployWithListingFixture)

      await expect(market.connect(creator).delistItem(listingId))
        .to.emit(market, "ItemDelisted")
        .withArgs(listingId)
    })

    it("[Security] 非卖家不能下架：revert NotSeller", async () => {
      const { market, other, listingId } = await loadFixture(deployWithListingFixture)

      await expect(market.connect(other).delistItem(listingId))
        .to.be.revertedWithCustomError(market, "NotSeller")
    })

    it("[Security] 已下架的 listing 再下架：revert ListingNotActive", async () => {
      const { market, creator, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(creator).delistItem(listingId)

      await expect(market.connect(creator).delistItem(listingId))
        .to.be.revertedWithCustomError(market, "ListingNotActive")
    })
  })

  // ── buyItem() ───────────────────────────────────────────────────────────

  describe("buyItem()", () => {

    it("购买成功：NFT 转移给买家", async () => {
      const { nft, market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, 2n, { value: PRICE * 2n })

      expect(await nft.balanceOf(buyer.address, 1n)).to.equal(2n)
    })

    it("购买成功：触发 ItemSold 事件，金额正确", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await expect(
        market.connect(buyer).buyItem(listingId, 2n, { value: PRICE * 2n })
      )
        .to.emit(market, "ItemSold")
        .withArgs(listingId, buyer.address, 2n, PRICE * 2n)
    })

    it("购买成功：listing 剩余数量减少", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, 2n, { value: PRICE * 2n })
      const listing = await market.listings(listingId)

      expect(listing.amount).to.equal(AMOUNT - 2n)
      expect(listing.active).to.be.true
    })

    it("买完最后一份：listing 自动标记为 inactive", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, AMOUNT, { value: PRICE * AMOUNT })
      const listing = await market.listings(listingId)

      expect(listing.active).to.be.false
    })

    it("发送超额 ETH：退还多余部分", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      const overpay = PRICE * 3n  // 实际购 2 份，多付 1 MATIC
      const balanceBefore = await ethers.provider.getBalance(buyer.address)

      const tx = await market.connect(buyer).buyItem(listingId, 2n, { value: overpay })
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice

      const balanceAfter = await ethers.provider.getBalance(buyer.address)
      // 实际花费应接近 2 MATIC + gas（退还了多余的 1 MATIC）
      const actualCost = balanceBefore - balanceAfter - gasUsed
      expect(actualCost).to.equal(PRICE * 2n)
    })

    // ── 费用分配 ─────────────────────────────────────────────

    it("[Perf] 费用分配：平台手续费正确计入 pendingWithdrawals", async () => {
      const { market, feeRecipient, buyer, listingId } =
        await loadFixture(deployWithListingFixture)

      const totalPrice = PRICE * 2n
      await market.connect(buyer).buyItem(listingId, 2n, { value: totalPrice })

      // platformFeeBps = 250 (2.5%)
      const expectedFee = (totalPrice * 250n) / 10000n
      expect(await market.pendingWithdrawal(feeRecipient.address)).to.equal(expectedFee)
    })

    it("[Perf] 费用分配：版税正确计入创作者的 pendingWithdrawals", async () => {
      const { market, creator, buyer, listingId, ROYALTY_BPS } =
        await loadFixture(deployWithListingFixture)

      const totalPrice = PRICE * 2n
      await market.connect(buyer).buyItem(listingId, 2n, { value: totalPrice })

      const { royalty } = calcSplit(totalPrice, ROYALTY_BPS, 250n)
      expect(await market.pendingWithdrawal(creator.address)).to.be.closeTo(
        // 卖家收入 + 版税（creator 同时是卖家和版税接收方）
        royalty + calcSplit(totalPrice, ROYALTY_BPS, 250n).sellerAmount,
        ethers.parseEther("0.0001")  // 允许微小精度差
      )
    })

    // ── 异常场景 ─────────────────────────────────────────────

    it("[Security] 付款不足：revert InsufficientPayment", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await expect(
        market.connect(buyer).buyItem(listingId, 2n, { value: PRICE })  // 少付了 1 份
      )
        .to.be.revertedWithCustomError(market, "InsufficientPayment")
    })

    it("[Security] 购买数量超过库存：revert InsufficientStock", async () => {
      const { market, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await expect(
        market.connect(buyer).buyItem(listingId, AMOUNT + 1n, { value: PRICE * (AMOUNT + 1n) })
      )
        .to.be.revertedWithCustomError(market, "InsufficientStock")
    })

    it("[Security] 购买已下架的 listing：revert ListingNotActive", async () => {
      const { market, creator, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(creator).delistItem(listingId)

      await expect(
        market.connect(buyer).buyItem(listingId, 1n, { value: PRICE })
      )
        .to.be.revertedWithCustomError(market, "ListingNotActive")
    })

    it("[Security] 合约暂停时购买：revert EnforcedPause", async () => {
      const { market, owner, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(owner).pause()

      await expect(
        market.connect(buyer).buyItem(listingId, 1n, { value: PRICE })
      )
        .to.be.revertedWithCustomError(market, "EnforcedPause")
    })
  })

  // ── makeOffer() / acceptOffer() ─────────────────────────────────────────

  describe("makeOffer() / acceptOffer()", () => {

    async function makeOfferFixture() {
      const base = await deployWithListingFixture()
      const { market, buyer } = base

      const expiresAt = BigInt(await time.latest()) + 3600n  // 1 小时后过期

      // 买家对 tokenId=1 发出 2 份报价，总价 3 MATIC
      const offerTx = await market.connect(buyer).makeOffer(1n, 2n, expiresAt, {
        value: PRICE * 2n,
      })
      const receipt = await offerTx.wait()
      const event = receipt!.logs
        .map((log) => { try { return market.interface.parseLog(log) } catch { return null } })
        .find((e) => e?.name === "OfferMade")
      const offerId = event!.args.offerId as bigint

      return { ...base, offerId, expiresAt }
    }

    it("发出报价：触发 OfferMade 事件", async () => {
      const base = await loadFixture(deployWithListingFixture)
      const { market, buyer } = base
      const expiresAt = BigInt(await time.latest()) + 3600n

      await expect(
        market.connect(buyer).makeOffer(1n, 2n, expiresAt, { value: PRICE * 2n })
      )
        .to.emit(market, "OfferMade")
        .withArgs(1n, 1n, buyer.address, PRICE, 2n, expiresAt)
    })

    it("接受报价：NFT 转给买家，卖家获得收益", async () => {
      const { nft, market, creator, buyer, offerId } =
        await loadFixture(makeOfferFixture)

      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)
      await market.connect(creator).acceptOffer(offerId)

      expect(await nft.balanceOf(buyer.address, 1n)).to.equal(2n)
    })

    it("接受报价：触发 OfferAccepted 事件", async () => {
      const { nft, market, creator, offerId } = await loadFixture(makeOfferFixture)
      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

      await expect(market.connect(creator).acceptOffer(offerId))
        .to.emit(market, "OfferAccepted")
        .withArgs(offerId)
    })

    it("[Security] 接受已过期的报价：revert OfferExpired", async () => {
      const { nft, market, creator, offerId } = await loadFixture(makeOfferFixture)
      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

      // 快进时间超过过期时间
      await time.increase(3601)

      await expect(market.connect(creator).acceptOffer(offerId))
        .to.be.revertedWithCustomError(market, "OfferExpired")
    })

    it("[Security] 报价过期前不能重复接受（offer 变 inactive 后）", async () => {
      const { nft, market, creator, offerId } = await loadFixture(makeOfferFixture)
      await nft.connect(creator).setApprovalForAll(await market.getAddress(), true)

      await market.connect(creator).acceptOffer(offerId)

      await expect(market.connect(creator).acceptOffer(offerId))
        .to.be.revertedWithCustomError(market, "OfferNotActive")
    })

    it("[Security] 已过期时间戳无法发起报价：revert", async () => {
      const { market, buyer } = await loadFixture(deployWithListingFixture)
      const pastTimestamp = BigInt(await time.latest()) - 1n

      await expect(
        market.connect(buyer).makeOffer(1n, 2n, pastTimestamp, { value: PRICE * 2n })
      ).to.be.revertedWith("already expired")
    })

    // ── cancelOffer() ────────────────────────────────────────

    it("取消报价：买家收到退款", async () => {
      const { market, buyer, offerId } = await loadFixture(makeOfferFixture)

      const balanceBefore = await ethers.provider.getBalance(buyer.address)
      const tx = await market.connect(buyer).cancelOffer(offerId)
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice
      const balanceAfter = await ethers.provider.getBalance(buyer.address)

      // 应退还 2 MATIC（扣除 gas）
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(PRICE * 2n)
    })

    it("取消报价：触发 OfferCancelled 事件", async () => {
      const { market, buyer, offerId } = await loadFixture(makeOfferFixture)

      await expect(market.connect(buyer).cancelOffer(offerId))
        .to.emit(market, "OfferCancelled")
        .withArgs(offerId)
    })

    it("[Security] 非买家不能取消他人的报价：revert NotBuyer", async () => {
      const { market, other, offerId } = await loadFixture(makeOfferFixture)

      await expect(market.connect(other).cancelOffer(offerId))
        .to.be.revertedWithCustomError(market, "NotBuyer")
    })
  })

  // ── withdraw() ──────────────────────────────────────────────────────────

  describe("withdraw()", () => {

    it("成交后卖家可以提取收益", async () => {
      const { market, creator, buyer, listingId, ROYALTY_BPS } =
        await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, 1n, { value: PRICE })

      const pending = await market.pendingWithdrawal(creator.address)
      expect(pending).to.be.gt(0n)

      const balanceBefore = await ethers.provider.getBalance(creator.address)
      const tx = await market.connect(creator).withdraw()
      const receipt = await tx.wait()
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice
      const balanceAfter = await ethers.provider.getBalance(creator.address)

      expect(balanceAfter - balanceBefore + gasUsed).to.equal(pending)
    })

    it("提取后 pendingWithdrawal 归零", async () => {
      const { market, creator, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, 1n, { value: PRICE })
      await market.connect(creator).withdraw()

      expect(await market.pendingWithdrawal(creator.address)).to.equal(0n)
    })

    it("触发 Withdrawal 事件", async () => {
      const { market, creator, buyer, listingId } = await loadFixture(deployWithListingFixture)

      await market.connect(buyer).buyItem(listingId, 1n, { value: PRICE })
      const pending = await market.pendingWithdrawal(creator.address)

      await expect(market.connect(creator).withdraw())
        .to.emit(market, "Withdrawal")
        .withArgs(creator.address, pending)
    })

    it("[Security] 无可提取余额：revert NothingToWithdraw", async () => {
      const { market, other } = await loadFixture(deployMarketplaceFixture)

      await expect(market.connect(other).withdraw())
        .to.be.revertedWithCustomError(market, "NothingToWithdraw")
    })
  })

  // ── setFeeRate() ────────────────────────────────────────────────────────

  describe("setFeeRate()", () => {

    it("Owner 可以修改手续费率", async () => {
      const { market, owner } = await loadFixture(deployMarketplaceFixture)

      await market.connect(owner).setFeeRate(300n) // 3%
      expect(await market.platformFeeBps()).to.equal(300n)
    })

    it("[Security] 手续费率 > 1000（>10%）：revert FeeTooHigh", async () => {
      const { market, owner } = await loadFixture(deployMarketplaceFixture)

      await expect(market.connect(owner).setFeeRate(1001n))
        .to.be.revertedWithCustomError(market, "FeeTooHigh")
    })

    it("[Security] 非 Owner 不能修改手续费率", async () => {
      const { market, other } = await loadFixture(deployMarketplaceFixture)

      await expect(market.connect(other).setFeeRate(100n))
        .to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount")
    })
  })
})
