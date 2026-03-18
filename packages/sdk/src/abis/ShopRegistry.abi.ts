export const SHOP_REGISTRY_ABI = [
  // registerShop(string name, string metadataURI)
  {
    type: "function",
    name: "registerShop",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "metadataURI", type: "string" },
    ],
    outputs: [],
  },
  // updateShopMeta(string metadataURI)
  {
    type: "function",
    name: "updateShopMeta",
    stateMutability: "nonpayable",
    inputs: [{ name: "metadataURI", type: "string" }],
    outputs: [],
  },
  // isRegistered(address owner)
  {
    type: "function",
    name: "isRegistered",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  // Event: ShopRegistered
  {
    type: "event",
    name: "ShopRegistered",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
] as const
