import anchor from '@coral-xyz/anchor';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import * as solanaWeb3 from '@solana/web3.js';
import { CHAINS } from '../../../config.js';
import bs58 from 'bs58';

// Get the equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import ./mutual-escrow-idl.json
const MUTUAL_ESCROW_IDL = JSON.parse(
  readFileSync(join(__dirname, './mutual-escrow-idl.json'), 'utf8')
);

export const MUTUAL_ESCROW_PROGRAM = (chainId) => {
  const chain = CHAINS.find((c) => c.id === chainId);
  if (!chain) {
    throw new Error('Chain not found');
  }

  console.log('Chain', chain);

  // Convert secret key to keypair
  const adminKp = solanaWeb3.Keypair.fromSecretKey(bs58.decode(process.env.ADMIN_WALLET_PK));
  const adminWallet = new anchor.Wallet(adminKp);
  console.log('Escrow Admin Wallet', adminWallet.publicKey.toBase58());

  // Create a connection to the Solana network
  const connection = new solanaWeb3.Connection(chain.rpcUrl, 'confirmed');

  // Create an Anchor provider
  const provider = new anchor.AnchorProvider(connection, adminWallet, {
    preflightCommitment: 'confirmed',
    commitment: 'confirmed'
  });

  // Create an Anchor program
  const program = new anchor.Program(
    MUTUAL_ESCROW_IDL,
    new solanaWeb3.PublicKey(process.env.ESCROW_PROGRAM_ID),
    provider
  )

  return program;
}