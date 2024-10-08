export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const USDC_MINT = {
  name: "USDC",
  symbol: "USDC",
  decimals: 6,
  isNative: false,
  imageUrl: "https://res.coinpaper.com/coinpaper/usd_coin_usdc_logo_3e68fafa38.png"
}

export const DIRECT_PAYMENT_TOKEN = {
  ...USDC_MINT
}

export const CHAINS = [
  {
    id: "mainnet-beta",
    dbChainId: "MAINNET_BETA",
    portalChainId: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    name: "Mainnet Beta",
    rpcUrl:
      import.meta.env.VITE_MAINNET_RPC_URL ||
      "https://api.mainnet-beta.solana.com",
    escrowProgramId: import.meta.env.VITE_ESCROW_PROGRAM_ID,
    directPaymentToken: {
      ...USDC_MINT,
      mintAddress: ""
    }
  },
  {
    id: "devnet",
    dbChainId: "DEVNET",
    portalChainId: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
    name: "Devnet",
    rpcUrl:
      import.meta.env.VITE_DEVNET_RPC_URL || "https://api.devnet.solana.com",
    escrowProgramId: import.meta.env.VITE_ESCROW_PROGRAM_ID,
    directPaymentToken: {
      ...USDC_MINT,
      mintAddress: "7B85SqobCqr5mBMBz9QeCpgxcAnhThFu2anpkoUdAdfb"
    }
  },
  {
    id: "localnet",
    dbChainId: "LOCALNET",
    name: "Localnet",
    rpcUrl: import.meta.env.VITE_LOCALNET_RPC_URL || "http://localhost:8899",
    escrowProgramId: import.meta.env.VITE_ESCROW_PROGRAM_ID,
    directPaymentToken: {
      ...USDC_MINT,
      mintAddress: "7B85SqobCqr5mBMBz9QeCpgxcAnhThFu2anpkoUdAdfb"
    }
  },
];

export const OFFER_CONFIG = {
  firstUnlockPercentage: 0.2,
  secondUnlockPercentage: 0.8,
};
