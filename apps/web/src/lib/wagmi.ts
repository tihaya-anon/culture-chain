import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { polygon, polygonMumbai, hardhat } from "wagmi/chains"
import { http } from "wagmi"

const walletConnectProjectId =
  process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? ""

const targetChainId = Number(process.env["NEXT_PUBLIC_CHAIN_ID"] ?? 31337)
const activeChain =
  targetChainId === polygon.id ? polygon :
  targetChainId === polygonMumbai.id ? polygonMumbai :
  hardhat
const localRpcUrl = process.env["NEXT_PUBLIC_POLYGON_RPC_URL"] ?? "http://127.0.0.1:8545"

export const wagmiConfig = getDefaultConfig({
  appName: "CultureChain",
  projectId: walletConnectProjectId,
  chains: [activeChain],
  transports: {
    [polygon.id]: http(process.env["NEXT_PUBLIC_POLYGON_RPC_URL"]),
    [polygonMumbai.id]: http(),
    [hardhat.id]: http(localRpcUrl),
  },
  ssr: true,
})
