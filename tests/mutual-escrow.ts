import * as anchor from "@coral-xyz/anchor";
import * as borsh from "borsh";
import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";

/**
 * Mutual Escrow Contract Test using the latest @solana/spl-token npm package
 */

import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
  createInitializeAccountInstruction,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  getMinimumBalanceForRentExemptAccount,
} from "@solana/spl-token";
import assert from "assert";
import BN from "bn.js";
import type { MutualEscrow } from "../target/types/mutual_escrow";

describe("Mutual Escrow Contract Tests", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MutualEscrow as anchor.Program<MutualEscrow>;
  
  it("Create Deal with SPL Token Transfer In", async () => {
    // Initialize Keypairs
    const adminKp = new Keypair();
    const projectOwnerKp = new Keypair();
    const kolKp = new Keypair();

    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(adminKp.publicKey, LAMPORTS_PER_SOL)
    );

    // Airdrop SOL to project owner and KOL
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        projectOwnerKp.publicKey,
        LAMPORTS_PER_SOL
      )
    );
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(kolKp.publicKey, LAMPORTS_PER_SOL)
    );

    console.log("=== Airdrop Completed");

    // Create the Escrow account via 'initialize' instruction
    const escrowSeed = Buffer.from("escrow");
    const [escrowPda, escrowBump] = await PublicKey.findProgramAddress(
      [escrowSeed],
      program.programId
    );

    console.log("=== Escrow Account created");

    // Build the 'initialize' instruction data
    const initializeIx = new web3.TransactionInstruction({
      keys: [
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: adminKp.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: program.programId,
      data: Buffer.from([0]), // Instruction discriminator for 'initialize'
    });

        console.log("=== Airdrop Completed");

    // Create an SPL Token Mint
    const mintKeypair = new Keypair();
    const mintRent = await getMinimumBalanceForRentExemptMint(program.provider.connection);
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: adminKp.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: 82, // Mint account size
      programId: TOKEN_PROGRAM_ID,
    });

    const initMintIx = createInitializeAccountInstruction(
      mintKeypair.publicKey,
      9, // Decimals
      adminKp.publicKey,
      null,
      TOKEN_PROGRAM_ID
    );

    // Create the transaction to create and initialize the mint
    let tx = new Transaction().add(createMintAccountIx, initMintIx);
    await web3.sendAndConfirmTransaction(program.provider.connection, tx, [
      adminKp,
      mintKeypair,
    ]);

    // Create an associated token account for the project owner
    const projectOwnerTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      adminKp,
      mintKeypair.publicKey,
      projectOwnerKp.publicKey
    );

    // Mint tokens to the project owner's token account
    await mintTo(
      program.provider.connection,
      adminKp,
      mintKeypair.publicKey,
      projectOwnerTokenAccount.address,
      adminKp,
      1000 * 10 ** 9 // Mint 1000 tokens (assuming 9 decimals)
    );

    // Prepare 'create_deal' instruction
    const dealSeed = Buffer.from("deal");
    const [dealPda, dealBump] = await PublicKey.findProgramAddress(
      [
        dealSeed,
        projectOwnerKp.publicKey.toBuffer(),
        kolKp.publicKey.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Vault Token Account
    const vaultTokenAccountSeed = Buffer.from("vault_token_account");
    const [vaultTokenAccountPda, vaultTokenAccountBump] =
      await PublicKey.findProgramAddress(
        [vaultTokenAccountSeed, mintKeypair.publicKey.toBuffer()],
        program.programId
      );

    // Vault Authority PDA
    const vaultAuthoritySeed = Buffer.from("vault_authority");
    const [vaultAuthorityPda, vaultAuthorityBump] =
      await PublicKey.findProgramAddress(
        [vaultAuthoritySeed, mintKeypair.publicKey.toBuffer()],
        program.programId
      );

    // Build the 'create_deal' instruction data
    const amount = new BN(500 * 10 ** 9); // 500 tokens
    const vestingDuration = new BN(60 * 60 * 24 * 30); // 30 days
    const vestingTypeTime = 0; // Enum value for VestingType::Time

    // Serialize instruction data using borsh
    const createDealInstructionLayout = borsh.struct([
      borsh.u8("instruction"),
      borsh.u64("amount"),
      borsh.u8("vestingType"),
      borsh.i64("vestingDuration"),
      borsh.option(borsh.array(borsh.u8(), 32), "marketcapAuthorizer"),
    ]);

    const createDealData = Buffer.alloc(1000); // Allocate sufficient buffer
    const createDealInstructionData = {
      instruction: 1, // Instruction discriminator for 'create_deal'
      amount: amount,
      vestingType: vestingTypeTime,
      vestingDuration: vestingDuration,
      marketcapAuthorizer: null, // None for VestingType::Time
    };
    const length = createDealInstructionLayout.encode(
      createDealInstructionData,
      createDealData
    );
    const createDealDataTrimmed = createDealData.slice(0, length);

    const createDealIx = new web3.TransactionInstruction({
      keys: [
        { pubkey: escrowPda, isSigner: false, isWritable: true },
        { pubkey: dealPda, isSigner: false, isWritable: true },
        { pubkey: projectOwnerKp.publicKey, isSigner: true, isWritable: true },
        { pubkey: kolKp.publicKey, isSigner: false, isWritable: false },
        { pubkey: mintKeypair.publicKey, isSigner: false, isWritable: false },
        {
          pubkey: projectOwnerTokenAccount.address,
          isSigner: false,
          isWritable: true,
        },
        { pubkey: vaultTokenAccountPda, isSigner: false, isWritable: true },
        { pubkey: vaultAuthorityPda, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: web3.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      ],
      programId: program.programId,
      data: createDealDataTrimmed,
    });

    // Create transaction and add the instructions
    tx = new Transaction().add(initializeIx, createDealIx);

    // Send and confirm the transaction
    await web3.sendAndConfirmTransaction(
      program.provider.connection,
      tx,
      [adminKp, projectOwnerKp],
      { skipPreflight: false, commitment: "confirmed" }
    );

    // Fetch the token accounts and verify the balances
    const projectOwnerTokenAccountInfo = await getAccount(
      program.provider.connection,
      projectOwnerTokenAccount.address
    );
    const vaultTokenAccountInfo = await getAccount(
      program.provider.connection,
      vaultTokenAccountPda
    );

    // The project owner should have 500 tokens left
    assert.equal(
      Number(projectOwnerTokenAccountInfo.amount),
      500 * 10 ** 9,
      "Project owner's token account should have 500 tokens"
    );
    // The vault should have received 500 tokens
    assert.equal(
      Number(vaultTokenAccountInfo.amount),
      500 * 10 ** 9,
      "Vault token account should have 500 tokens"
    );
  });
});
