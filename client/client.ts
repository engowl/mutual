import BN from "bn.js";
import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
// client.ts

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import BN from "bn.js";
import { Program } from "@project-serum/anchor";
import type { MutualEscrow } from "../target/types/mutual_escrow";

// Configure the client to use the local cluster
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.MutualEscrow as anchor.Program<MutualEscrow>;


(async () => {
  try {
    // Assuming 'pg' is a global object providing the connection, wallet, and program
    const connection = program.provider.connection;
    const wallet = pg.wallet;
    const program = program; // The Anchor program instance

    // Initialize keypairs
    const adminKp = wallet.keypair; // Admin is the wallet owner
    const projectOwnerKp = web3.Keypair.generate();
    const kolKp = web3.Keypair.generate();

    // Airdrop SOL to project owner and KOL on localnet
    await connection.confirmTransaction(
      await connection.requestAirdrop(
        projectOwnerKp.publicKey,
        web3.LAMPORTS_PER_SOL
      )
    );
    await connection.confirmTransaction(
      await connection.requestAirdrop(kolKp.publicKey, web3.LAMPORTS_PER_SOL)
    );

    // Create an SPL Token Mint
    const decimals = 9;
    const mintKeypair = web3.Keypair.generate();
    const mint = await splToken.createMint(
      connection,
      adminKp,
      adminKp.publicKey,
      null,
      decimals,
      mintKeypair
    );

    console.log(`Mint created: ${mint.toBase58()}`);

    // Create Associated Token Account for the project owner
    const projectOwnerTokenAccount =
      await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        adminKp,
        mint,
        projectOwnerKp.publicKey
      );

    console.log(
      `Project Owner's Token Account: ${projectOwnerTokenAccount.address.toBase58()}`
    );

    // Mint tokens to the project owner's token account
    const mintAmount = 1000 * 10 ** decimals; // 1000 tokens
    await splToken.mintTo(
      connection,
      adminKp,
      mint,
      projectOwnerTokenAccount.address,
      adminKp,
      mintAmount
    );

    console.log(`Minted ${mintAmount} tokens to project owner's account`);

    const orderId = "your-unique-order-id";
    const orderIdBuffer = prepareOrderId(orderId);

    console.log("orderIdBuffer", orderIdBuffer);

    // Prepare PDAs
    const [dealPda, dealBump] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("deal"),
        orderIdBuffer, // Use only the first 4 bytes
        projectOwnerKp.publicKey.toBuffer(),
        kolKp.publicKey.toBuffer(),
        mint.toBuffer(),
      ],
      program.programId
    );

    const [vaultTokenAccountPda, vaultTokenAccountBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault_token_account"), mint.toBuffer()],
        program.programId
      );

    const [vaultAuthorityPda, vaultAuthorityBump] =
      web3.PublicKey.findProgramAddressSync(
        [Buffer.from("vault_authority"), mint.toBuffer()],
        program.programId
      );

    console.log("prepared PDAs\n", {
      dealPda: dealPda.toBase58(),
      vaultTokenAccountPda: vaultTokenAccountPda.toBase58(),
      vaultAuthorityPda: vaultAuthorityPda.toBase58(),
    });

    let txHash: any;
    const confirmOptions = {
      commitment: "confirmed",
      skipPreflight: true,
    };

    // Initialize the Escrow
    const [escrowPda, escrowBump] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );
    // Check if the escrow account already exists
    const escrowAccountInfo = await connection.getAccountInfo(escrowPda);
    if (escrowAccountInfo === null) {
      // Escrow account does not exist, so initialize it
      await program.methods
        .initialize()
        .accounts({
          escrow: escrowPda,
          admin: adminKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([adminKp])
        .rpc(confirmOptions);
      console.log(`Escrow initialized at ${escrowPda.toBase58()}`);
    } else {
      // Escrow account already exists
      console.log(`Escrow account already exists at ${escrowPda.toBase58()}`);
    }

    // Create Deal
    const amount = new anchor.BN(800 * 10 ** decimals); // 800 tokens
    const vestingDuration = new anchor.BN(60); // 1 minute

    txHash = await program.methods
      .createDeal(
        amount,
        { time: {} }, // VestingType::Time
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
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([projectOwnerKp])
      .rpc(confirmOptions);

    console.log(`CreateDeal`);
    await logTransaction(txHash);

    console.log(`Deal created at ${dealPda.toBase58()}`);

    // Fetch and display token account balances
    let projectOwnerTokenAccountInfo = await splToken.getAccount(
      connection,
      projectOwnerTokenAccount.address
    );
    console.log(
      "Project Owner's token amount: " +
        Number(projectOwnerTokenAccountInfo.amount) / 10 ** decimals
    );

    let vaultTokenAccountInfo = await splToken.getAccount(
      connection,
      vaultTokenAccountPda
    );
    console.log(
      "Vault token amount: " +
        Number(vaultTokenAccountInfo.amount) / 10 ** decimals
    );

    await fetchAndDisplayDealDetails(txHash);
    await getEscrowStats();

    async function logTransaction(txHash: string) {
      const latestBlockHash = await connection.getLatestBlockhash();

      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockHash,
        },
        "confirmed"
      );

      console.log(
        `Transaction confirmed: https://explorer.solana.com/tx/${txHash}?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899`
      );
    }

    async function fetchAndDisplayDealDetails(txHash: string) {
      console.log("\nFetching transaction details...");
      const tx = await connection.getTransaction(txHash, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        console.log("Failed to fetch transaction details.");
        return;
      }

      const { message } = tx.transaction;
      const accountKeys = message.staticAccountKeys;
      const instructionCoder = new anchor.BorshInstructionCoder(program.idl);

      let dealInfo: string[] = [];

      for (const instruction of message.compiledInstructions) {
        if (!accountKeys[instruction.programIdIndex].equals(program.programId))
          continue;

        try {
          const decoded = instructionCoder.decode(
            Buffer.from(instruction.data, "base64")
          );
          if (decoded?.name !== "createDeal") continue;

          const { amount, vestingType, vestingDuration, marketcapAuthorizer } =
            decoded.data;
          const kolPubkey = accountKeys[instruction.accountKeyIndexes[3]];

          dealInfo.push("\n====== Deal Details ======");
          dealInfo.push(`Amount: ${amount.toNumber() / 10 ** decimals} tokens`);
          dealInfo.push(`KOL: ${kolPubkey.toBase58()}`);
          dealInfo.push(
            `Vesting: ${Object.keys(
              vestingType
            )[0].toUpperCase()}, ${vestingDuration.toNumber()} seconds`
          );
          if (marketcapAuthorizer)
            dealInfo.push(
              `Marketcap Authorizer: ${marketcapAuthorizer.toBase58()}`
            );

          const dealData = await program.account.deal.fetch(dealPda);
          dealInfo.push("\nDeal Account:");
          dealInfo.push(`Project Owner: ${dealData.projectOwner.toBase58()}`);
          dealInfo.push(`Mint: ${dealData.mint.toBase58()}`);
          dealInfo.push(
            `Start: ${new Date(dealData.startTime * 1000).toLocaleString()}`
          );
          dealInfo.push(`Status: ${Object.keys(dealData.status)[0]}`);
          dealInfo.push("============");

          break;
        } catch (err) {
          console.log("Failed to decode instruction:", err);
        }
      }

      if (dealInfo.length > 0) {
        console.log(dealInfo.join("\n"));
      } else {
        console.log("No 'createDeal' instruction found in the transaction.");
      }
    }

    async function getEscrowStats() {
      console.log("\nFetching Escrow Stats...");

      const dealAccounts = await program.account.deal.all();
      // Sort the dealAccounts from oldest to newest based on startTime using BN.cmp()
      dealAccounts.sort((a, b) => {
        return b.account.startTime.cmp(a.account.startTime);
      });

      for (const account of dealAccounts) {
        const [vaultTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
          [Buffer.from("vault_token_account"), account.account.mint.toBuffer()],
          program.programId
        );
        console.log("vaultTokenPda", vaultTokenAccountPda.toBase58());
      }

      const tokensPerMint: { [mint: string]: number } = {};

      console.log("dealAccounts", dealAccounts.length);

      await Promise.all(
        dealAccounts.map(async ({ account: dealData }) => {
          const mintPubkey = dealData.mint.toBase58();

          const [vaultTokenAccountPda] = web3.PublicKey.findProgramAddressSync(
            [Buffer.from("vault_token_account"), dealData.mint.toBuffer()],
            program.programId
          );

          const vaultTokenAccountInfo = await splToken.getAccount(
            connection,
            vaultTokenAccountPda
          );
          const amount = Number(vaultTokenAccountInfo.amount);

          tokensPerMint[mintPubkey] = (tokensPerMint[mintPubkey] || 0) + amount;
        })
      );

      const statsArray: string[] = ["Escrow Token Holdings:"];

      Object.entries(tokensPerMint).forEach(([mint, amount]) => {
        statsArray.push(`- Mint: ${mint}`);
        statsArray.push(`  Total Tokens in Escrow: ${amount / 10 ** decimals}`);
      });

      if (statsArray.length > 1) {
        console.log(statsArray.join("\n"));
      } else {
        console.log("No tokens found in escrow.");
      }
    }

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
  } catch (e) {
    console.log("e", e);
  }
})();
