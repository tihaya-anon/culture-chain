import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "dotenv/config"

const DEPLOYER_PRIVATE_KEY =
  process.env["DEPLOYER_PRIVATE_KEY"] ??
  // Hardhat 默认测试账户 #0（仅本地使用，不含真实资产）
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    mumbai: {
      url: process.env["MUMBAI_RPC_URL"] ?? "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
    polygon: {
      url:
        process.env["NEXT_PUBLIC_POLYGON_RPC_URL"] ??
        "https://polygon-rpc.com",
      chainId: 137,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },

  etherscan: {
    apiKey: {
      polygon: process.env["POLYGONSCAN_API_KEY"] ?? "",
      polygonMumbai: process.env["POLYGONSCAN_API_KEY"] ?? "",
    },
  },

  gasReporter: {
    enabled: process.env["REPORT_GAS"] === "true",
    currency: "USD",
    token: "MATIC",
    coinmarketcap: process.env["COINMARKETCAP_API_KEY"],
  },

  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
}

export default config
