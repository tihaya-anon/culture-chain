# 部署与运行指南

## 当前推荐方式

当前仓库最稳定的运行方式是：

- 本地 Hardhat 链
- 本地合约部署
- 本地 Next.js 前端
- 所有日志输出到 `./logs/`

统一入口：

```bash
make demo-up
```

停止：

```bash
make demo-down
```

状态检查：

```bash
make demo-status
```

---

## 本地运行模式

### 1. 最小 Demo 模式

适合直接体验当前已实现功能：

```bash
pnpm install
cp .env.local.example .env.local
make demo-up
```

默认效果：

- 启动本地 Hardhat 链
- 部署本地合约
- 启动前端
- 写日志到 `logs/`

当前可演示能力：

- 浏览作品
- 进入作品详情
- 铸造作品
- 自动授权并上架
- 购买作品

### 2. 分步运行模式

如果需要单独调试：

```bash
make chain
make deploy-local
make web
```

---

## 端口约束

前端当前**固定使用 `3000` 端口**。

如果 `3000` 被占用，`make web` 会直接失败，并打印：

- 占用端口的 PID
- 对应的 `kill` 命令

这样不会再自动切换到 `3001/3002/3003` 导致访问混乱。

---

## 日志位置

所有运行日志统一写入当前仓库根目录：

```text
logs/hardhat-node.log
logs/deploy-local.log
logs/web.log
logs/typecheck.log
logs/contracts-test.log
```

---

## 本地链部署产物

部署脚本会输出到：

```text
apps/contracts/ignition/deployments/localhost.json
```

同时会同步更新：

```text
packages/sdk/src/constants/addresses.ts
```

用于前端和 SDK 直接读取本地地址。

---

## 当前不建议视为已完成的部署项

以下内容仍属于未来规划，不应当成当前成果：

- Polygon Mumbai 完整集成测试
- Polygon Mainnet 正式发布
- Vercel 生产环境上线
- 独立数据库 / 搜索生产化部署
- 事件索引器服务
- 监控告警全链路

这些能力未来可以继续补，但当前仓库的“真实可用”交付物仍是本地最小 Demo。
