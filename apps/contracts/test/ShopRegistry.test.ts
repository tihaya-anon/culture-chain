import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

// ── Fixture ────────────────────────────────────────────────────────────────

async function deployShopRegistryFixture() {
  const [owner, creatorA, creatorB, other] = await ethers.getSigners()

  const ShopRegistry = await ethers.getContractFactory("ShopRegistry")
  const registry = await ShopRegistry.deploy(owner.address)
  await registry.waitForDeployment()

  const SHOP_NAME     = "水墨工坊"
  const SHOP_META_URI = "ipfs://QmShopMeta123"

  return { registry, owner, creatorA, creatorB, other, SHOP_NAME, SHOP_META_URI }
}

async function deployWithRegisteredShopFixture() {
  const base = await deployShopRegistryFixture()
  await base.registry.connect(base.creatorA).registerShop(base.SHOP_NAME, base.SHOP_META_URI)
  return base
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("ShopRegistry", () => {

  // ── registerShop() ──────────────────────────────────────────────────────

  describe("registerShop()", () => {

    it("注册成功：isRegistered 返回 true", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)

      expect(await registry.isRegistered(creatorA.address)).to.be.true
    })

    it("注册成功：getShop 返回正确数据", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)
      const shop = await registry.getShop(creatorA.address)

      expect(shop.owner).to.equal(creatorA.address)
      expect(shop.name).to.equal(SHOP_NAME)
      expect(shop.metadataURI).to.equal(SHOP_META_URI)
      expect(shop.verified).to.be.false
    })

    it("注册成功：getShopByName 可按名称查询", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)
      const shop = await registry.getShopByName(SHOP_NAME)

      expect(shop.owner).to.equal(creatorA.address)
    })

    it("注册成功：触发 ShopRegistered 事件", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await expect(registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI))
        .to.emit(registry, "ShopRegistered")
        .withArgs(creatorA.address, SHOP_NAME)
    })

    it("注册成功：createdAt 被记录（非零）", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)
      const shop = await registry.getShop(creatorA.address)

      expect(shop.createdAt).to.be.gt(0n)
    })

    it("metadataURI 可为空字符串（可选字段）", async () => {
      const { registry, creatorA } = await loadFixture(deployShopRegistryFixture)

      await expect(
        registry.connect(creatorA).registerShop("空URI店", "")
      ).not.to.be.reverted
    })

    // ── 重复注册 ─────────────────────────────────────────────

    it("[Security] 同地址重复注册：revert AlreadyRegistered", async () => {
      const { registry, creatorA, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)

      await expect(
        registry.connect(creatorA).registerShop("新名字", "ipfs://new")
      )
        .to.be.revertedWithCustomError(registry, "AlreadyRegistered")
        .withArgs(creatorA.address)
    })

    it("[Security] 店铺名被占用：revert NameTaken", async () => {
      const { registry, creatorA, creatorB, SHOP_NAME, SHOP_META_URI } =
        await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop(SHOP_NAME, SHOP_META_URI)

      await expect(
        registry.connect(creatorB).registerShop(SHOP_NAME, "ipfs://creatorB")
      )
        .to.be.revertedWithCustomError(registry, "NameTaken")
        .withArgs(SHOP_NAME)
    })

    it("[Security] 空店铺名：revert EmptyName", async () => {
      const { registry, creatorA } = await loadFixture(deployShopRegistryFixture)

      await expect(
        registry.connect(creatorA).registerShop("", "ipfs://meta")
      ).to.be.revertedWithCustomError(registry, "EmptyName")
    })

    it("多个不同地址可注册不同名称的店铺", async () => {
      const { registry, creatorA, creatorB } = await loadFixture(deployShopRegistryFixture)

      await registry.connect(creatorA).registerShop("店铺A", "ipfs://metaA")
      await registry.connect(creatorB).registerShop("店铺B", "ipfs://metaB")

      expect(await registry.isRegistered(creatorA.address)).to.be.true
      expect(await registry.isRegistered(creatorB.address)).to.be.true
    })
  })

  // ── updateShopMeta() ────────────────────────────────────────────────────

  describe("updateShopMeta()", () => {

    it("已注册用户可更新 metadataURI", async () => {
      const { registry, creatorA } = await loadFixture(deployWithRegisteredShopFixture)
      const newURI = "ipfs://QmNewMeta456"

      await registry.connect(creatorA).updateShopMeta(newURI)
      const shop = await registry.getShop(creatorA.address)

      expect(shop.metadataURI).to.equal(newURI)
    })

    it("更新成功：触发 ShopUpdated 事件", async () => {
      const { registry, creatorA } = await loadFixture(deployWithRegisteredShopFixture)
      const newURI = "ipfs://QmNewMeta456"

      await expect(registry.connect(creatorA).updateShopMeta(newURI))
        .to.emit(registry, "ShopUpdated")
        .withArgs(creatorA.address, newURI)
    })

    it("[Security] 未注册地址调用 updateShopMeta：revert NotRegistered", async () => {
      const { registry, other } = await loadFixture(deployShopRegistryFixture)

      await expect(registry.connect(other).updateShopMeta("ipfs://fake"))
        .to.be.revertedWithCustomError(registry, "NotRegistered")
        .withArgs(other.address)
    })
  })

  // ── verifyShop() ────────────────────────────────────────────────────────

  describe("verifyShop()", () => {

    it("Owner 可认证店铺，verified 变为 true", async () => {
      const { registry, owner, creatorA } = await loadFixture(deployWithRegisteredShopFixture)

      await registry.connect(owner).verifyShop(creatorA.address)
      const shop = await registry.getShop(creatorA.address)

      expect(shop.verified).to.be.true
    })

    it("认证成功：触发 ShopVerified 事件", async () => {
      const { registry, owner, creatorA } = await loadFixture(deployWithRegisteredShopFixture)

      await expect(registry.connect(owner).verifyShop(creatorA.address))
        .to.emit(registry, "ShopVerified")
        .withArgs(creatorA.address)
    })

    it("[Security] 非 Owner 不能认证店铺", async () => {
      const { registry, creatorB, creatorA } = await loadFixture(deployWithRegisteredShopFixture)

      await expect(registry.connect(creatorB).verifyShop(creatorA.address))
        .to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount")
    })

    it("[Security] 认证未注册地址：revert NotRegistered", async () => {
      const { registry, owner, other } = await loadFixture(deployShopRegistryFixture)

      await expect(registry.connect(owner).verifyShop(other.address))
        .to.be.revertedWithCustomError(registry, "NotRegistered")
        .withArgs(other.address)
    })
  })

  // ── isRegistered() ──────────────────────────────────────────────────────

  describe("isRegistered()", () => {

    it("未注册地址返回 false", async () => {
      const { registry, other } = await loadFixture(deployShopRegistryFixture)

      expect(await registry.isRegistered(other.address)).to.be.false
    })

    it("注册后返回 true", async () => {
      const { registry, creatorA } = await loadFixture(deployWithRegisteredShopFixture)

      expect(await registry.isRegistered(creatorA.address)).to.be.true
    })
  })
})
