/**
 * ABI 占位符，在合约编译后由 TypeChain 自动生成替换
 * 运行 `pnpm contracts:compile` 后，从 typechain-types/ 导入
 */
export const CULTURE_NFT_ABI = [
  // mint(string uri, uint96 royaltyBps, uint256 supply, string contentHash, uint8 category)
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "uri", type: "string" },
      { name: "royaltyBps", type: "uint96" },
      { name: "supply", type: "uint256" },
      { name: "contentHash", type: "string" },
      { name: "category", type: "uint8" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  // balanceOf(address account, uint256 id)
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "id", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  // setApprovalForAll(address operator, bool approved)
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  // isApprovedForAll(address account, address operator)
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ type: "bool" }],
  },
  // uri(uint256 tokenId)
  {
    type: "function",
    name: "uri",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ type: "string" }],
  },
  // getWorkInfo(uint256 tokenId)
  {
    type: "function",
    name: "getWorkInfo",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "royaltyBps", type: "uint96" },
          { name: "maxSupply", type: "uint256" },
          { name: "contentHash", type: "string" },
          { name: "category", type: "uint8" },
        ],
      },
    ],
  },
  // royaltyInfo(uint256 tokenId, uint256 salePrice)
  {
    type: "function",
    name: "royaltyInfo",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "receiver", type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
  },
  // verifyContent(string contentHash)
  {
    type: "function",
    name: "verifyContent",
    stateMutability: "view",
    inputs: [{ name: "contentHash", type: "string" }],
    outputs: [{ name: "tokenId", type: "uint256" }],
  },
  // Event: WorkMinted
  {
    type: "event",
    name: "WorkMinted",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "supply", type: "uint256", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
  // Event: ApprovalForAll
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      { name: "account", type: "address", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "approved", type: "bool", indexed: false },
    ],
  },
] as const
