import { CHAIN } from "@prisma/client";

export const CHAINS = [
  {
    id: "mainnet-beta",
    dbChainId: CHAIN.MAINNET_BETA, // 'MAINNET_BETA'
    name: "Mainnet Beta",
    rpcUrl:
      process.env.MAINNET_RPC_URL || "https://api.mainnet-beta.solana.com",
    escrowProgramId: process.env.ESCROW_PROGRAM_ID,
  },
  {
    id: "devnet",
    dbChainId: CHAIN.DEVNET, // 'DEVNET'
    name: "Devnet",
    rpcUrl: process.env.DEVNET_RPC_URL || "https://api.devnet.solana.com",
    escrowProgramId: process.env.ESCROW_PROGRAM_ID,
  },
  // {
  //   id: "localnet",
  //   dbChainId: CHAIN.LOCALNET, // 'LOCALNET'
  //   name: "Localnet",
  //   rpcUrl: process.env.LOCALNET_RPC_URL || "http://localhost:8899",
  //   escrowProgramId: process.env.ESCROW_PROGRAM_ID,
  // },
];

console.log("chain", CHAINS);

export const VESTING_CONFIG = [
  {
    id: "TIME",
    name: "Time-based Vesting",
    conditions: ["1-month", "2-months", "3-months", "6-months", "1-year"],
    allowCustom: false, // Time-based vesting doesn't allow custom conditions
  },
  {
    id: "MARKETCAP",
    name: "Market Cap-based Vesting",
    conditions: [500_000, 1_000_000, 5_000_000, 10_000_000], // Predefined thresholds
    allowCustom: true, // Market Cap-based vesting allows custom thresholds
  },
  {
    id: "NONE",
    name: "None Vesting",
    conditions: null, // No conditions for "None" type
    allowCustom: false, // No custom conditions allowed
  },
];
export const OFFER_EXPIRY_IN_MINUTES = 60 * 24; // 24 hours

export const MINIMUM_POST_LIVE_IN_MINUTES = 60 * 6; // 6 hours

export const PARTIAL_UNLOCK_PERCENTAGE = 20;
