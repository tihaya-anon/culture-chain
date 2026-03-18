export const MARKETPLACE_ABI = [
  // listItem(uint256 tokenId, uint256 pricePerUnit, uint256 amount)
  {
    type: "function",
    name: "listItem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "pricePerUnit", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "listingId", type: "uint256" }],
  },
  // delistItem(uint256 listingId)
  {
    type: "function",
    name: "delistItem",
    stateMutability: "nonpayable",
    inputs: [{ name: "listingId", type: "uint256" }],
    outputs: [],
  },
  // buyItem(uint256 listingId, uint256 amount)
  {
    type: "function",
    name: "buyItem",
    stateMutability: "payable",
    inputs: [
      { name: "listingId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  // makeOffer(uint256 tokenId, uint256 amount, uint256 expiresAt)
  {
    type: "function",
    name: "makeOffer",
    stateMutability: "payable",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
    ],
    outputs: [{ name: "offerId", type: "uint256" }],
  },
  // withdraw()
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  // pendingWithdrawal(address)
  {
    type: "function",
    name: "pendingWithdrawal",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  // Event: ItemListed
  {
    type: "event",
    name: "ItemListed",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "seller", type: "address", indexed: false },
      { name: "price", type: "uint256", indexed: false },
    ],
  },
  // Event: ItemSold
  {
    type: "event",
    name: "ItemSold",
    inputs: [
      { name: "listingId", type: "uint256", indexed: true },
      { name: "buyer", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "totalPrice", type: "uint256", indexed: false },
    ],
  },
] as const
