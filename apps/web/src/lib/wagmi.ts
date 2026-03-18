import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { polygon, polygonMumbai } from "wagmi/chains"
import { http } from "wagmi"

const walletConnectProjectId =
  process.env["NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID"] ?? ""

export const wagmiConfig = getDefaultConfig({
  appName: "CultureChain",
  projectId: walletConnectProjectId,
  chains: [
    process.env["NODE_ENV"] === "production" ? polygon : polygonMumbai,
  ],
  transports: {
    [polygon.id]: http(process.env["NEXT_PUBLIC_POLYGON_RPC_URL"]),
    [polygonMumbai.id]: http(),
  },
  ssr: true,
})
