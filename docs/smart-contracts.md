# 智能合约设计文档

## 当前已实现合约

当前仓库中真实存在并已测试的合约：

| 合约 | 状态 | 说明 |
|------|------|------|
| `CultureNFT.sol` | 已实现 | ERC-1155 + ERC-2981 文化作品 NFT |
| `Marketplace.sol` | 已实现 | 固定价上架、购买、报价、提现 |
| `ShopRegistry.sol` | 已实现 | 创作者店铺注册与元数据维护 |

当前**没有**独立的 `RoyaltyRegistry` 合约，旧文档里提到的这部分不属于当前实现。

---

## CultureNFT.sol

### 已实现能力

- ERC-1155 多份发行
- ERC-2981 版税标准
- `mint`
- `burn`
- `uri`
- `getWorkInfo`
- `verifyContent`
- `pause / unpause`

### 当前核心接口

```solidity
function mint(
    string memory metadataURI,
    uint96 royaltyBps,
    uint256 supply,
    string memory contentHash,
    WorkCategory category
) external returns (uint256 tokenId);

function burn(uint256 tokenId, uint256 amount) external;

function getWorkInfo(uint256 tokenId) external view returns (WorkInfo memory);

function verifyContent(string memory contentHash) external view returns (uint256);
```

### 当前规则

- `royaltyBps` 最大 `1000`，即 10%
- `contentHash` 不能为空
- `contentHash` 不能重复注册
- `supply = 0` 表示开放版，但当前会先铸 1 份所有权凭证给创作者

### 当前未实现

- `mintBatch`
- 复杂的 metadata 更新逻辑
- 可升级机制

---

## Marketplace.sol

### 已实现能力

- `listItem`
- `delistItem`
- `buyItem`
- `makeOffer`
- `acceptOffer`
- `cancelOffer`
- `withdraw`
- `pendingWithdrawal`
- `setFeeRate`
- `setFeeRecipient`
- `pause / unpause`

### 当前费用模型

每笔交易：

```text
totalPrice
  = platform fee
  + royalty
  + seller proceeds
```

默认平台手续费：

- `250 bps` = `2.5%`

版税来源：

- 通过 `IERC2981.royaltyInfo(tokenId, totalPrice)` 查询

### 当前设计特点

- Pull Payment 模式
- `ReentrancyGuard`
- `Pausable`
- `Ownable`

### 当前未实现

- `updatePrice`
- 订单撮合系统
- 拍卖
- 多币种支付

---

## ShopRegistry.sol

### 已实现能力

- `registerShop`
- `updateShopMeta`
- `getShop`
- `getShopByName`
- `isRegistered`
- `verifyShop`

### 当前用途

当前合约已完成并有测试，但前端完整店铺注册流还没有真正接入；前端 `/profile/[address]` 仍偏展示层。

---

## 本地 Demo 如何使用这些合约

当前本地最小 Demo 的真实链路：

1. 用户在 `/mint` 填写作品信息
2. 前端生成 demo metadata
3. 调用 `CultureNFT.mint`
4. 调用 `setApprovalForAll`
5. 调用 `Marketplace.listItem`
6. 买家在 `/works/[tokenId]` 调用 `Marketplace.buyItem`

也就是说，当前前端真正打通的是：

- NFT 铸造
- 市场上架
- 固定价购买

而不是完整生产系统的全部能力。

---

## 测试现状

当前仓库中的 Hardhat 测试已覆盖：

- `CultureNFT`
- `Marketplace`
- `ShopRegistry`

本地执行入口：

```bash
make contracts-test
```

测试重点包括：

- 铸造成功与边界校验
- 版税计算
- content hash 注册校验
- 上架 / 下架
- 购买与退款
- 报价与取消报价
- 提现
- 店铺注册与认证

---

## 当前文档边界

本文件描述的是**当前代码已经存在的合约能力**。

以下能力如果未来需要扩展，应单独新增“规划设计”章节，而不是混在当前实现里：

- 批量铸造
- 测试网 / 主网部署治理流程
- 独立 indexer
- 独立版税注册中心
- 内容访问控制后端
