# 快速启动指南

本文档帮助你在本地从零启动 CultureChain 开发环境。
**当前阶段：本地最小 Demo 可运行**。可以直接在本地 Hardhat 链完成铸造、上架、购买；数据库和外部服务默认 mock。

---

## 环境要求

| 工具 | 最低版本 | 安装方式 |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | 9+ | `npm install -g pnpm` |
| Git | — | 系统自带或官网下载 |
| Docker Desktop | — | 可选，用于 PostgreSQL/Meilisearch |

---

## 模式一：最小 Demo 启动（推荐）

> 当前推荐模式：本地链 + 本地前端 + mock/链上混合数据，不依赖真实外部服务。

```bash
# 1. 克隆项目
git clone https://github.com/your-org/culture-chain.git
cd culture-chain

# 2. 安装依赖
pnpm install

# 3. 创建本地环境变量
cp .env.local.example .env.local
```

打开 `.env.local`，只需填写一个值：

```bash
# 免费申请：https://cloud.walletconnect.com → 创建 Project → 复制 Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **不想注册 WalletConnect？** 填任意字符串也能启动，只是钱包连接弹窗可能报错，
> 浏览页面和 mock 数据不受影响。

```bash
# 4. 启动完整本地 Demo
make demo-up
```

打开 http://localhost:3000 — 完成 🎉

### 当前可访问的页面

| 路由 | 内容 |
|------|------|
| `/` | 首页（Hero + 分类 + 精选作品） |
| `/works` | 作品列表（分类筛选、排序） |
| `/works/1` | 作品详情（作品 tokenId 1-8 可访问） |
| `/mint` | 铸造向导（真实调用本地链 mint/list） |
| `/profile/0x1234` | 创作者店铺页（任意地址可访问） |

---

## 模式二：扩展本地开发环境

> 用于继续接数据库和搜索，不是当前最小可运行闭环的必需项。

### 步骤 1：启动数据库服务

```bash
# 启动 PostgreSQL + Meilisearch（后台运行）
docker compose up -d

# 验证启动成功
docker compose ps
# 应看到 postgres(healthy) 和 meilisearch(running)
```

### 步骤 2：数据库初始化

```bash
# 生成 Prisma Client 并推送 schema
pnpm db:migrate

# 可选：打开可视化管理界面（运行后访问 http://localhost:5555）
pnpm db:studio
```

### 步骤 3：本地区块链与前端

```bash
# 一条命令后台启动本地 Demo
make demo-up
```

如需分别控制，可使用：

```bash
make chain
make deploy-local
make web
```

日志统一输出到仓库根目录的 `./logs/`：

```bash
logs/hardhat-node.log
logs/deploy-local.log
logs/web.log
```

### 步骤 4：连接本地节点的 MetaMask 配置

1. MetaMask → 设置 → 网络 → 添加网络
2. 填入：
   - 网络名称：`Hardhat Local`
   - RPC URL：`http://127.0.0.1:8545`
   - 链 ID：`31337`
   - 货币符号：`ETH`
3. 导入测试账户（Hardhat 默认账户，**仅用于本地测试**）：
   - 私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - 余额：10,000 ETH

### 步骤 5：状态与关闭

```bash
make demo-status
```

停止后台 Demo：

```bash
make demo-down
```

---

## 常用开发命令

```bash
# ── 前端 ─────────────────────────────────────────────────────
make web                     # 启动前端
make demo-up                 # 启动完整本地 demo
make demo-down               # 停止本地 demo
make demo-status             # 查看本地 demo 状态
pnpm build                   # 构建生产版本
make typecheck               # 前端 TypeScript 类型检查

# ── 合约 ─────────────────────────────────────────────────────
make contracts-test          # 运行 76 个合约单元测试
pnpm contracts:compile       # 编译合约，生成 TypeChain 类型
make deploy-local            # 部署到本地 Hardhat 节点
pnpm contracts:deploy:mumbai # 部署到 Polygon Mumbai 测试网

# ── 数据库 ───────────────────────────────────────────────────
pnpm db:migrate              # 运行数据库迁移
pnpm db:studio               # 打开 Prisma Studio 可视化界面
pnpm db:push                 # 直接推送 schema（开发快速迭代用）

# ── 代码质量 ─────────────────────────────────────────────────
pnpm lint                    # ESLint 检查
pnpm format                  # Prettier 格式化所有文件
```

---

## Demo 数据说明

当前页面采用“双轨数据来源”：

- 本地链有数据时：优先读取链上事件和合约状态
- 本地链无数据时：回退到 `apps/web/src/lib/mockData.ts`

当前 mock 数据覆盖以下场景：

| 场景 | 示例 |
|------|------|
| 正常在售 | tokenId 1, 2, 3, 5, 6, 7, 8 |
| 已售罄 | tokenId 4（supply=200, sold=200） |
| 无限量发行 | tokenId 7（supply=0） |
| 高价作品 | tokenId 8（3.0 ETH） |

### 后续替换方向

下一阶段建议把这些页面从“链上直读 / mock fallback”切换为真正的 API / DB 驱动。

当前不少 mock 调用仍通过注释标记了待替换位置：

```typescript
// TODO: 替换为真实 API 调用
const works = MOCK_WORKS.filter(...)
```

Phase 3 开始后逐步替换为：

```typescript
const res  = await fetch("/api/v1/works?category=" + category)
const json = await res.json()
const works: Work[] = json.data
```

---

## 常见问题

**Q：启动时报 `invalid project ID`**
> WalletConnect project ID 无效。前往 https://cloud.walletconnect.com 免费申请，或用空字符串（仅影响钱包弹窗）。

**Q：图片不显示，控制台报 `hostname not configured`**
> `next.config.ts` 中 `remotePatterns` 缺少对应域名。开发时已添加 `images.unsplash.com`。

**Q：`pnpm dev` 后访问页面报 500**
> 检查 `.env.local` 是否存在。若没有，执行 `cp .env.local.example .env.local`。

**Q：后台启动后想看日志**
> 统一查看 `./logs/` 目录，或执行 `make demo-status` 确认进程状态。

**Q：合约测试在 WSL2 下失败**
> 在 `apps/contracts` 目录内单独运行 `pnpm hardhat test`，而不要用根目录的 `pnpm test`。

**Q：`mcopy` 编译错误**
> `hardhat.config.ts` 中已设置 `evmVersion: "cancun"`，如仍报错请确认 OpenZeppelin 版本为 v5.x。
