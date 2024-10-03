import BN from "bn.js";
import assert from "assert";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MutualEscrow } from "../target/types/mutual_escrow";
import * as splToken from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import type { MutualEscrow } from "../target/types/mutual_escrow";

describe("mutual_escrow", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MutualEscrow as anchor.Program<MutualEscrow>;
  
  // Set up the provider and program
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MutualEscrow as Program<MutualEscrow>;
  const connection = provider.connection;
  const wallet = provider.wallet;

  // Keypairs
  const adminKp = program.provider.wallet.payer;
  let projectOwnerKp: Keypair;
  let kolKp: Keypair;

  // Token mint and accounts
  let mint: PublicKey;
  let mintKeypair: Keypair;
  let projectOwnerTokenAccount: splToken.Account;

  // PDAs
  let escrowPda: PublicKey;
  let dealPda: PublicKey;
  let vaultTokenAccountPda: PublicKey;
  let vaultAuthorityPda: PublicKey;

  // Other variables
  const decimals = 9;
  const orderId = "your-unique-order-id";
  let orderIdBuffer: Buffer;

  before(async () => {
    // Initialize keypairs
    projectOwnerKp = Keypair.generate();
    kolKp = Keypair.generate();

    // Airdrop SOL to project owner and KOL
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        projectOwnerKp.publicKey,
        LAMPORTS_PER_SOL
      ),
      "confirmed"
    );
    await connection.confirmTransaction(
      await connection.requestAirdrop(kolKp.publicKey, LAMPORTS_PER_SOL),
      "confirmed"
    );

    // Create an SPL Token Mint
    mintKeypair = Keypair.generate();
    mint = await splToken.createMint(
      connection,
      adminKp,
      adminKp.publicKey,
      null,
      decimals,
      mintKeypair,
      { commitment: "confirmed" }
    );

    console.log(`Mint created: ${mint.toBase58()}`);

    // Create Associated Token Account for the project owner
    projectOwnerTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      adminKp,
      mint,
      projectOwnerKp.publicKey
    );

    console.log(
      `Project Owner's Token Account: ${projectOwnerTokenAccount.address.toBase58()}`
    );

    // Mint tokens to the project owner's token account
    const mintAmount = BigInt(1000 * 10 ** decimals);
    await splToken.mintTo(
      connection,
      adminKp,
      mint,
      projectOwnerTokenAccount.address,
      adminKp,
      Number(mintAmount)
    );

    console.log(`Minted ${mintAmount} tokens to project owner's account`);

    // Prepare order ID buffer
    orderIdBuffer = prepareOrderId(orderId);

    console.log("orderIdBuffer", orderIdBuffer);

    // Prepare PDAs
    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    [dealPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("deal"),
        orderIdBuffer,
        projectOwnerKp.publicKey.toBuffer(),
        kolKp.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );

    [vaultTokenAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_token_account"), mint.toBuffer()],
      program.programId
    );

    [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority"), mint.toBuffer()],
      program.programId
    );

    console.log("Prepared PDAs", {
      escrowPda: escrowPda.toBase58(),
      dealPda: dealPda.toBase58(),
      vaultTokenAccountPda: vaultTokenAccountPda.toBase58(),
      vaultAuthorityPda: vaultAuthorityPda.toBase58(),
    });

    // Initialize the Escrow if not already initialized
    const escrowAccountInfo = await connection.getAccountInfo(escrowPda);
    if (escrowAccountInfo === null) {
      await program.methods
        .initialize()
        .accounts({
          escrow: escrowPda,
          admin: adminKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([])
        .rpc({ commitment: "confirmed" });
      console.log(`Escrow initialized at ${escrowPda.toBase58()}`);
    } else {
      console.log(`Escrow account already exists at ${escrowPda.toBase58()}`);
    }
  });

  it("Should create a deal", async () => {
    const amount = new anchor.BN(800 * 10 ** decimals);
    const vestingDuration = new anchor.BN(60);

    const txHash = await program.methods
      .createDeal(
        amount,
        { time: {} },
        vestingDuration,
        null,
        Array.from(orderIdBuffer)
      )
      .accounts({
        escrow: escrowPda,
        deal: dealPda,
        projectOwner: projectOwnerKp.publicKey,
        kol: kolKp.publicKey,
        mint: mint,
        projectOwnerTokenAccount: projectOwnerTokenAccount.address,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([projectOwnerKp])
      .rpc({ commitment: "confirmed" });

    console.log(`CreateDeal transaction signature: ${txHash}`);

    // Confirm transaction
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: txHash,
        ...latestBlockHash,
      },
      "confirmed"
    );

    // Fetch and display token account balances
    const projectOwnerTokenAccountInfo = await splToken.getAccount(
      connection,
      projectOwnerTokenAccount.address
    );

    console.log(
      "Project Owner's token amount: " +
        Number(projectOwnerTokenAccountInfo.amount) / 10 ** decimals
    );

    const vaultTokenAccountInfo = await splToken.getAccount(
      connection,
      vaultTokenAccountPda
    );

    console.log(
      "Vault token amount: " +
        Number(vaultTokenAccountInfo.amount) / 10 ** decimals
    );

    // Assertions
    assert.equal(
      Number(projectOwnerTokenAccountInfo.amount),
      200 * 10 ** decimals,
      "Project Owner should have 200 tokens after transferring 800 tokens to the vault"
    );

    assert.equal(
      Number(vaultTokenAccountInfo.amount),
      800 * 10 ** decimals,
      "Vault should have 800 tokens after deal creation"
    );

    // Fetch and display deal details
    const dealData = await program.account.deal.fetch(dealPda);
    console.log("Deal Data:", dealData);

    // Assertions on deal data
    assert.equal(
      dealData.projectOwner.toBase58(),
      projectOwnerKp.publicKey.toBase58()
    );
    assert.equal(dealData.kol.toBase58(), kolKp.publicKey.toBase58());
    assert.equal(dealData.mint.toBase58(), mint.toBase58());
    assert.equal(dealData.amount.toString(), amount.toString());
    assert.equal(dealData.releasedAmount.toNumber(), 0);
    assert.equal(Object.keys(dealData.vestingType)[0], "time");
    assert.equal(
      dealData.vestingDuration.toNumber(),
      vestingDuration.toNumber()
    );
    // Add more assertions as needed
  });

  // Add more tests here, e.g., for releasing tokens, handling disputes, etc.

  function prepareOrderId(orderId: string): Buffer {
    let orderIdBuffer = Buffer.from(orderId, "utf-8");
    if (orderIdBuffer.length > 16) {
      orderIdBuffer = orderIdBuffer.slice(0, 16);
    } else if (orderIdBuffer.length < 16) {
      const padding = Buffer.alloc(16 - orderIdBuffer.length);
      orderIdBuffer = Buffer.concat([orderIdBuffer, padding], 16);
    }
    return orderIdBuffer;
  }
});
