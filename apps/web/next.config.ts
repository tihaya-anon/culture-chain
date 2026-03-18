import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@culture-chain/ui", "@culture-chain/sdk"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
    ],
  },
  // 禁止 Server Actions 在生产中意外暴露
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
}

export default nextConfig
