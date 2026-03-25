# 系统架构设计

## 当前状态

CultureChain 当前已经具备一个**可本地运行的最小 Web3 Demo**：

- 前端：Next.js 14 App Router
- 合约：Hardhat + Solidity
- 本地链：Hardhat Local `31337`
- 交易链路：铸造、授权、上架、购买
- 数据来源：
  - 本地链有数据时，页面优先读取链上事件与合约状态
  - 本地链无数据时，回退到 mock 数据

当前还**没有真正接入**以下能力：

- SIWE 登录
- PostgreSQL 索引读写闭环
- Meilisearch 搜索服务
- IPFS / Pinata 实际上传
- 后端 API Route 业务闭环
- 事件索引器

所以现阶段架构应理解为：**“前端 + 本地链 + 合约 + mock/链上混合读取”**，而不是完整生产架构。

---

## 当前运行架构

```text
┌──────────────────────────────────────────────────────┐
│                    Browser / Wallet                  │
│      Creator / Collector + MetaMask / RainbowKit    │
└─────────────────────────┬────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────┐
│                 Next.js 14 Frontend                  │
│                                                      │
│  Routes                                              │
│  - /                 Landing page                    │
│  - /works           Marketplace list                 │
│  - /works/[tokenId] Work detail                      │
│  - /mint            Mint wizard                      │
│  - /profile/[addr]  Creator storefront              │
│                                                      │
│  Rendering                                           │
│  - Server Components: page composition + reads       │
│  - Client Components: wallet actions / modal / form  │
└──────────────────────┬───────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌─────────▼─────────┐
│  packages/sdk  │          │  apps/web/src/lib │
│ wagmi + viem   │          │   demo-chain.ts   │
│ write hooks    │          │ server-side reads │
└───────┬────────┘          └─────────┬─────────┘
        │                             │
        └──────────────┬──────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                 Hardhat Local Chain                  │
│                      chainId 31337                   │
│                                                      │
│  - CultureNFT     ERC-1155 + ERC-2981 minting        │
│  - Marketplace    listing / buying / offers          │
│  - ShopRegistry   creator storefront registry        │
└──────────────────────────────────────────────────────┘
```

---

## 前端分层

### 1. 页面层

当前页面结构：

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/works/page.tsx`
- `apps/web/src/app/works/[tokenId]/page.tsx`
- `apps/web/src/app/mint/page.tsx`
- `apps/web/src/app/profile/[address]/page.tsx`

页面职责：

- 组织页面布局
- 在服务端读取本地链 demo 数据
- 在链上无数据时回退 mock 数据

### 2. 客户端交互层

当前主要客户端交互组件：

- `MintWizard`
- `BuyModal`
- `WorkDetailActions`
- `Navbar`

职责：

- 钱包连接
- 铸造交易
- 上架交易
- 购买交易
- 交易状态反馈

### 3. 共享交互封装

`packages/sdk` 当前主要提供：

- 合约地址常量
- ABI
- `useMintWork`
- `useSetApprovalForAll`
- `useListItem`
- `useBuyItem`
- `useWithdraw`

这些 hook 当前直接服务于**本地 Demo 链路**。

---

## 链上数据读取方式

当前前端不是通过后端 API 读数据，而是通过 `apps/web/src/lib/demo-chain.ts` 直接用 `viem` 读取本地链：

### Works 列表读取

来源：

- `CultureNFT.WorkMinted`
- `Marketplace.ItemListed`
- `Marketplace.ItemSold`

构造逻辑：

1. 读取所有 `WorkMinted`
2. 读取活跃 `ItemListed`
3. 汇总 `ItemSold`
4. 拼装出前端 `Work` 结构

### Work 详情读取

来源：

- `getDemoWork(tokenId)`
- `CultureNFT.getWorkInfo`
- `CultureNFT.uri`
- `Marketplace.listings`

### 回退逻辑

如果本地链没有作品数据，则页面回退到：

- `apps/web/src/lib/mockData.ts`

这保证了页面在没有链上数据时依然能展示。

---

## 当前交易闭环

### 铸造闭环

当前 `MintWizard` 实际执行的是：

1. 收集标题、描述、分类、文件、价格、版税
2. 在前端直接生成 demo `metadataURI`
3. 生成 `contentHash`
4. 调用 `CultureNFT.mint(...)`
5. 调用 `setApprovalForAll(marketplace, true)`
6. 调用 `Marketplace.listItem(...)`

注意：

- 当前未接入真实 IPFS
- 当前 metadata 使用前端即时生成的 `data:` URI
- 当前文件上传仍是本地表单输入，不落真实存储

### 购买闭环

当前 `BuyModal` 实际执行的是：

1. 读取当前 work 对应的 `listingId`
2. 调用 `Marketplace.buyItem(listingId, amount)`
3. 等待链上确认
4. 刷新页面状态

### 店铺页

当前 `/profile/[address]` 仍主要基于 mock 数据展示。

虽然 `ShopRegistry` 合约已实现并通过测试，但前端店铺注册 / 编辑流程尚未接入。

---

## 合约层关系

当前真实存在的合约只有三个：

```text
ShopRegistry
CultureNFT
Marketplace
```

关系如下：

```text
Creator
  └─ mint on CultureNFT
       └─ approve Marketplace
            └─ list on Marketplace
                 └─ buyer purchases

ShopRegistry
  └─ independent storefront registry contract
```

当前**不存在**：

- `RoyaltyRegistry`
- 升级代理
- 独立 indexer

---

## 与文档规划的差异

当前代码已经实现：

- Monorepo 基础设施
- 3 个核心合约
- 合约测试
- 本地部署脚本
- 本地可运行前端
- 本地链最小交易闭环

当前代码尚未实现：

- 生产级后端
- 数据库读写闭环
- 搜索
- 内容审核
- 真实去中心化存储
- 测试网 / 主网产品化发布流程

因此，后续文档建议统一分为两层：

- `Current implemented state`
- `Planned production architecture`

避免把未来规划写成当前成果。
