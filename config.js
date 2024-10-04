export const CHAINS = [
  // {
  //   id: 'mainnet-beta',
  //   name: 'Mainnet Beta',
  //   rpcUrl: process.env.MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com',
  //   escrowProgramId: process.env.ESCROW_PROGRAM_ID
  // },
  {
    id: 'devnet',
    name: 'Devnet',
    rpcUrl: process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com',
    escrowProgramId: process.env.ESCROW_PROGRAM_ID
  },
  // {
  //   id: 'localnet',
  //   name: 'Localnet',
  //   rpcUrl: process.env.LOCALNET_RPC_URL || 'http://localhost:8899',
  //   escrowProgramId: process.env.ESCROW_PROGRAM_ID
  // }
]