# CultureChain — Web3 文化作品交易平台

> 用区块链守护创作价值，让文化作品自由流转

## 是什么

CultureChain 是一个去中心化的文化作品交易市场，支持画作、书籍、影视、音乐等数字内容的发行与交易。创作者可以像开咸鱼店一样简单地上架作品，同时通过 NFT 技术实现版权确权、版税自动分配和二级市场流通。

## 核心价值

- **极简开店**：Web2 级别的操作体验，无需了解区块链也能发布作品
- **版权上链**：作品哈希指纹和所有权记录在区块链，不可篡改
- **自动版税**：二级市场每次转售，版税自动打回创作者钱包（ERC-2981）
- **低成本**：运行在 Polygon 网络，Gas 费用极低（通常低于 $0.01）
- **永久存储**：作品文件存储在 IPFS/Arweave，不依赖中心化服务器

## 快速开始

```bash
# 克隆项目
git clone https://github.com/your-org/culture-chain.git
cd culture-chain

# 安装依赖（使用 pnpm）
pnpm install

# 复制环境变量
cp .env.example .env.local
# 本地最小 demo（自动启动本地链、部署合约、启动前端）
make demo-up
```

访问 http://localhost:3000

日志统一输出到 `./logs/`，停止服务使用 `make demo-down`。

## 文档目录

- [架构设计](./docs/architecture.md)
- [开发计划](./docs/development-plan.md)
- [智能合约](./docs/smart-contracts.md)
- [部署指南](./docs/deployment.md)
- [快速启动](./docs/quickstart.md)
- [Web3 特性与功能](./docs/web3-features.md)

## 技术栈概览

Next.js 14 · Tailwind CSS · wagmi v2 · Solidity · Hardhat · Polygon · IPFS · PostgreSQL

## 贡献

见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## 许可证

MIT
