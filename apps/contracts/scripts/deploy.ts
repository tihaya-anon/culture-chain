import { ethers, network } from "hardhat"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"

function updateLocalAddresses(contracts: {
  ShopRegistry: string
  CultureNFT: string
  Marketplace: string
}) {
  if (network.config.chainId !== 31337) return

  const target = join(__dirname, "../../../packages/sdk/src/constants/addresses.ts")
  const content = `const envAddresses = {
  CultureNFT: process.env["NEXT_PUBLIC_CONTRACT_CULTURE_NFT"] as \`0x\${string}\` | undefined,
  Marketplace: process.env["NEXT_PUBLIC_CONTRACT_MARKETPLACE"] as \`0x\${string}\` | undefined,
  ShopRegistry: process.env["NEXT_PUBLIC_CONTRACT_SHOP_REGISTRY"] as \`0x\${string}\` | undefined,
}

/**
 * 合约地址常量
 * 本地开发优先使用 .env.local，其次使用 deploy 脚本写回的静态值。
 */
export const CONTRACT_ADDRESSES = {
  /** Polygon Mainnet (chainId: 137) */
  137: {
    CultureNFT: "" as \`0x\${string}\`,
    Marketplace: "" as \`0x\${string}\`,
    ShopRegistry: "" as \`0x\${string}\`,
  },
  /** Polygon Mumbai Testnet (chainId: 80001) */
  80001: {
    CultureNFT: "" as \`0x\${string}\`,
    Marketplace: "" as \`0x\${string}\`,
    ShopRegistry: "" as \`0x\${string}\`,
  },
  /** Hardhat Local (chainId: 31337) */
  31337: {
    CultureNFT: envAddresses.CultureNFT ?? "${contracts.CultureNFT}" as \`0x\${string}\`,
    Marketplace: envAddresses.Marketplace ?? "${contracts.Marketplace}" as \`0x\${string}\`,
    ShopRegistry: envAddresses.ShopRegistry ?? "${contracts.ShopRegistry}" as \`0x\${string}\`,
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES
`

  writeFileSync(target, content)
}

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log(`\n🚀 Deploying on: ${network.name}`)
  console.log(`   Deployer: ${deployer.address}`)
  console.log(`   Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} MATIC\n`)

  // 1. ShopRegistry
  console.log("1/3 Deploying ShopRegistry...")
  const ShopRegistry = await ethers.getContractFactory("ShopRegistry")
  const shopRegistry = await ShopRegistry.deploy(deployer.address)
  await shopRegistry.waitForDeployment()
  const shopRegistryAddress = await shopRegistry.getAddress()
  console.log(`   ✓ ShopRegistry: ${shopRegistryAddress}`)

  // 2. CultureNFT
  console.log("2/3 Deploying CultureNFT...")
  const CultureNFT = await ethers.getContractFactory("CultureNFT")
  const cultureNFT = await CultureNFT.deploy(deployer.address)
  await cultureNFT.waitForDeployment()
  const cultureNFTAddress = await cultureNFT.getAddress()
  console.log(`   ✓ CultureNFT: ${cultureNFTAddress}`)

  // 3. Marketplace
  console.log("3/3 Deploying Marketplace...")
  const Marketplace = await ethers.getContractFactory("Marketplace")
  const marketplace = await Marketplace.deploy(
    cultureNFTAddress,
    deployer.address, // fee recipient（生产中应换为多签地址）
    deployer.address
  )
  await marketplace.waitForDeployment()
  const marketplaceAddress = await marketplace.getAddress()
  console.log(`   ✓ Marketplace: ${marketplaceAddress}`)

  // 输出部署结果
  const deployments = {
    network:      network.name,
    chainId:      network.config.chainId,
    deployedAt:   new Date().toISOString(),
    deployer:     deployer.address,
    contracts: {
      ShopRegistry: shopRegistryAddress,
      CultureNFT:   cultureNFTAddress,
      Marketplace:  marketplaceAddress,
    },
  }

  const outPath = join(__dirname, `../ignition/deployments/${network.name}.json`)
  mkdirSync(join(__dirname, "../ignition/deployments"), { recursive: true })
  writeFileSync(outPath, JSON.stringify(deployments, null, 2))
  updateLocalAddresses(deployments.contracts)

  console.log(`\n✅ Deployment complete!`)
  console.log(`   Saved to: ${outPath}`)
  console.log(`\n   ⚠️  Update packages/sdk/src/constants/addresses.ts with:`)
  console.log(JSON.stringify(deployments.contracts, null, 4))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
