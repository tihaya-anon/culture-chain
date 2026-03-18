import { ethers, network } from "hardhat"
import { writeFileSync } from "fs"
import { join } from "path"

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
  writeFileSync(outPath, JSON.stringify(deployments, null, 2))

  console.log(`\n✅ Deployment complete!`)
  console.log(`   Saved to: ${outPath}`)
  console.log(`\n   ⚠️  Update packages/sdk/src/constants/addresses.ts with:`)
  console.log(JSON.stringify(deployments.contracts, null, 4))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
