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
  // let mint: PublicKey;
  let mint = new PublicKey("6EXeGq2NuPUyB9UFWhbs35DBieQjhLrSfY2FU3o9gtr7");
  const decimals = 6;
  let mintKeypair: Keypair;
  let projectOwnerTokenAccount: splToken.Account;

  // PDAs
  let escrowPda: PublicKey;
  let dealPda: PublicKey;
  let vaultTokenAccountPda: PublicKey;
  let vaultAuthorityPda: PublicKey;

  // Other variables
  const orderId = "abcd1234abcd1234abcd1234";
  let orderIdBuffer: Buffer;

  const max_claimable_after_obligation = 25;

  async function createTransferTransaction(
    connection,
    adminKp,
    projectOwnerKp,
    walletPublicKey
  ) {
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

    // Get the token account of the wallet we're transferring from
    const fromWalletTokenAccount =
      await splToken.getOrCreateAssociatedTokenAccount(
        connection,
        adminKp,
        mint,
        walletPublicKey
      );

    console.log(
      `Wallet's Token Account: ${fromWalletTokenAccount.address.toBase58()}`
    );

    // Transfer 10,000 MUTUAL tokens to project owner
    const transferAmount = BigInt(10000 * 10 ** decimals);

    // Create a new transaction
    const transaction = new web3.Transaction().add(
      splToken.createTransferInstruction(
        fromWalletTokenAccount.address, // Source token account
        projectOwnerTokenAccount.address, // Destination token account
        walletPublicKey, // Owner of the source account
        transferAmount
      )
    );

    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;

    return transaction;
  }

  before(async () => {
    // Initialize keypairs
    projectOwnerKp = Keypair.generate();
    kolKp = Keypair.generate();

    // Give a bit of SOL to each wallet:
    // Define the smaller SOL amount (0.05 SOL)
    const smallAmount = 0.015 * LAMPORTS_PER_SOL;

    // Prepare the transaction to send SOL from 'wallet' to projectOwnerKp and kolKp
    const transaction = new web3.Transaction();

    // Fetch recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Set the payer (wallet) for the transaction
    transaction.feePayer = wallet.publicKey;

    // Instruction to send SOL to the project owner
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey, // wallet that will send the SOL
        toPubkey: projectOwnerKp.publicKey,
        lamports: smallAmount, // 0.05 SOL
      })
    );

    // Instruction to send SOL to the KOL
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: kolKp.publicKey,
        lamports: smallAmount, // 0.05 SOL
      })
    );

    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);

    // Send the transaction
    const tx = await connection.sendRawTransaction(
      signedTransaction.serialize()
    );

    // Confirm the transaction
    await connection.confirmTransaction(tx, "confirmed");
    console.log("transferred SOL", tx);

    // // Airdrop SOL to project owner and KOL
    // await connection.confirmTransaction(
    //   await connection.requestAirdrop(
    //     projectOwnerKp.publicKey,
    //     LAMPORTS_PER_SOL
    //   ),
    //   "confirmed"
    // );
    // await connection.confirmTransaction(
    //   await connection.requestAirdrop(kolKp.publicKey, LAMPORTS_PER_SOL),
    //   "confirmed"
    // );

    // Create an SPL Token Mint
    // mintKeypair = Keypair.generate();
    // mint = await splToken.createMint(
    //   connection,
    //   adminKp,
    //   adminKp.publicKey,
    //   null,
    //   decimals,
    //   mintKeypair,
    //   { commitment: "confirmed" }
    // );

    // console.log(`Mint created: ${mint.toBase58()}`);

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
    // const mintAmount = BigInt(10000 * 10 ** decimals);
    // await splToken.mintTo(
    //   connection,
    //   adminKp,
    //   mint,
    //   projectOwnerTokenAccount.address,
    //   adminKp,
    //   Number(mintAmount)
    // );

    // console.log(`Minted ${mintAmount} tokens to project owner's account`);

    // Transfer 10,000 MUTUAL token to project owner
    const testingTrfTx = await createTransferTransaction(
      connection,
      adminKp,
      projectOwnerKp,
      wallet.publicKey
    );
    const testingTrfSignedTx = await wallet.signTransaction(testingTrfTx);
    const latestBlockhash = await connection.getLatestBlockhash();
    testingTrfSignedTx.recentBlockhash = latestBlockhash.blockhash;
    testingTrfSignedTx.feePayer = wallet.publicKey;
    const testingTrfSent = await connection.sendRawTransaction(
      testingTrfSignedTx.serialize(),
      {
        preflightCommitment: "confirmed",
        skipPreflight: true,
      }
    );
    await connection.confirmTransaction(testingTrfSent, "confirmed");
    console.log("testing token transferred", testingTrfSent);

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
      [Buffer.from("vault_authority")],
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
        .initialize(max_claimable_after_obligation)
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
    const amount = new anchor.BN(1000 * 10 ** decimals);
    const vestingDuration = new anchor.BN(60);

    const txHash = await program.methods
      .createDeal(
        amount,
        { time: {} },
        vestingDuration,
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
      9000 * 10 ** decimals,
      "Project Owner should have 9000 tokens after transferring 1000 tokens to the vault"
    );

    assert.equal(
      Number(vaultTokenAccountInfo.amount),
      1000 * 10 ** decimals,
      "Vault should have 1000 tokens after deal creation"
    );

    // Fetch and display deal details
    const dealData = await program.account.deal.fetch(dealPda);
    // console.log("Deal Data:", dealData);

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

  // TODO: Try to reject the deal, if it's rejected, the fund will be transferred back to the project owner
  it("Should reject a deal and transfer funds back to the project owner", async () => {
    console.log("\n=====================\n");

    try {
      // First, create the deal to be rejected
      const amount = new anchor.BN(1000 * 10 ** decimals); // 1000 tokens
      const vestingDuration = new anchor.BN(60); // 1 minute

      orderIdBuffer = prepareOrderId("reject-order-id");

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

      let txHash = await program.methods
        .createDeal(
          amount,
          { time: {} }, // VestingType::Time
          vestingDuration,
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
        .rpc({
          commitment: "confirmed",
          skipPreflight: true,
        });

      console.log(`Deal created with txHash: ${txHash}`);

      // Check initial balances
      let projectOwnerTokenAccountInfo = await splToken.getAccount(
        connection,
        projectOwnerTokenAccount.address
      );
      console.log(
        "Project Owner's token amount after deal creation: " +
          Number(projectOwnerTokenAccountInfo.amount) / 10 ** decimals
      );

      let vaultTokenAccountInfo = await splToken.getAccount(
        connection,
        vaultTokenAccountPda
      );
      console.log(
        "Vault token amount after deal creation: " +
          Number(vaultTokenAccountInfo.amount) / 10 ** decimals
      );

      // Now, reject the deal
      txHash = await program.methods
        .rejectDeal()
        .accounts({
          deal: dealPda,
          escrow: escrowPda,
          signer: adminKp.publicKey, // Admin or KOL can sign
          projectOwner: projectOwnerKp.publicKey,
          vaultTokenAccount: vaultTokenAccountPda,
          vaultAuthority: vaultAuthorityPda,
          projectOwnerTokenAccount: projectOwnerTokenAccount.address,
          mint: mint,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([adminKp]) // Admin or KOL can sign
        .rpc({ commitment: "confirmed" });

      console.log(`Deal rejected with txHash: ${txHash}`);

      // Confirm the transaction
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txHash,
          ...latestBlockHash,
        },
        "confirmed"
      );

      // Fetch token account balances after rejection
      projectOwnerTokenAccountInfo = await splToken.getAccount(
        connection,
        projectOwnerTokenAccount.address
      );
      console.log(
        "Project Owner's token amount after rejecting deal: " +
          Number(projectOwnerTokenAccountInfo.amount) / 10 ** decimals
      );

      vaultTokenAccountInfo = await splToken.getAccount(
        connection,
        vaultTokenAccountPda
      );
      console.log(
        "Vault token amount after rejecting deal: " +
          Number(vaultTokenAccountInfo.amount) / 10 ** decimals
      );

      // Assertions to check the expected outcome
      assert.equal(
        Number(projectOwnerTokenAccountInfo.amount),
        9_000 * 10 ** decimals,
        "Project Owner should have 9000 tokens after rejecting the deal"
      );

      assert.equal(
        Number(vaultTokenAccountInfo.amount),
        1_000 * 10 ** decimals,
        "Vault should have 1000 tokens after rejecting the deal"
      );

      // Check deal status to ensure it's marked as 'Rejected'
      const dealData = (await program.account.deal.fetch(dealPda)) as any;
      let isRejected = new Boolean(dealData.status.rejected);

      assert.equal(isRejected, true, "Deal should be marked as 'Rejected'");
    } catch (e) {
      console.log("reject deal error", e);
      throw e;
    }
  });

  // Add more tests here, e.g., for releasing tokens, handling disputes, etc.
  it("Should create a market cap vesting deal, KOL claim partially and fully", async () => {
    const amount = new anchor.BN(1000 * 10 ** decimals); // 1000 tokens
    orderIdBuffer = prepareOrderId("marketcaporderz");

    const vestingDuration = new anchor.BN(0); // 0 minute

    // Create market cap vesting deal
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

    let txHash = await program.methods
      .createDeal(
        amount,
        { marketcap: {} }, // VestingType::Marketcap
        vestingDuration, // No duration needed for market cap vesting
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
      })
      .signers([projectOwnerKp])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log(`Market cap vesting deal created: ${txHash}`);

    // Status Checking
    const dealData = (await program.account.deal.fetch(dealPda)) as any;
    let isCreated = new Boolean(dealData.status.created);
    assert.equal(isCreated, true, "Deal should be marked as 'Created'");
    console.log("Deal become 'Created'");

    // KOL accept the deal
    txHash = await program.methods
      .acceptDeal()
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: kolKp.publicKey, // KOL signs the transaction
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log(`Deal accepted by KOL: ${txHash}`);

    // Fetch the updated deal data after the KOL accepts it
    const updatedDealData = (await program.account.deal.fetch(dealPda)) as any;
    let isAccepted = new Boolean(updatedDealData.status.accepted);
    assert.equal(isAccepted, true, "Deal should be marked as 'Accepted'");
    console.log("Deal status updated to 'Accepted'");

    // KOL becomes partially eligible
    txHash = await program.methods
      .setEligibilityStatus({ partiallyEligible: {} })
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    // Confirm transaction
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
      {
        signature: txHash,
        ...latestBlockHash,
      },
      "confirmed"
    );

    console.log("KOL is now partially eligible.");

    // KOL claims 20%
    let kolTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      adminKp,
      mint,
      kolKp.publicKey
    );

    txHash = await program.methods
      .resolveDeal()
      .accounts({
        deal: dealPda,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        kolTokenAccount: kolTokenAccount.address,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        escrow: escrowPda,
        signer: kolKp.publicKey,
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed" });

    console.log(
      `KOL claimed ${max_claimable_after_obligation}% of the tokens. txHash: ${txHash}`
    );

    // Admin sets fully eligible after market cap reached
    await program.methods
      .setEligibilityStatus({ fullyEligible: {} })
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    console.log("KOL is now fully eligible.");

    // KOL claims remaining 80%
    txHash = await program.methods
      .resolveDeal()
      .accounts({
        deal: dealPda,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        kolTokenAccount: kolTokenAccount.address,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        escrow: escrowPda,
        signer: kolKp.publicKey,
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed" });

    console.log(
      `KOL claimed ${
        100 - max_claimable_after_obligation
      }% of the tokens. txHash: ${txHash}`
    );
  });

  it("Should create a time vesting deal, KOL claims over time", async () => {
    const amount = new anchor.BN(1000 * 10 ** decimals);
    const vestingDuration = new anchor.BN(10); // 10 seconds vesting duration for easier testing
    const firstClaimDelay = 1000; // 1 second delay
    const secondClaimDelay = 10000; // 9 second delay
    const max_claimable_after_obligation = 25; // 25% for partial eligibility
    orderIdBuffer = prepareOrderId("time-order-id-hehe");

    // Create time vesting deal
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

    let txHash = await program.methods
      .createDeal(
        amount,
        { time: {} }, // VestingType::Time
        vestingDuration,
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

    console.log(`Time vesting deal created with txHash: ${txHash}`);

    // KOL accepts the deal
    txHash = await program.methods
      .acceptDeal()
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: kolKp.publicKey, // KOL signs the transaction
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed", skipPreflight: true });

    console.log(`Deal accepted by KOL with txHash: ${txHash}`);

    // KOL becomes partially eligible (based on max_claimable_after_obligation)
    await program.methods
      .setEligibilityStatus({ partiallyEligible: {} })
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    console.log(
      `KOL is now partially eligible (${max_claimable_after_obligation}%).`
    );

    // KOL claims the partial eligibility amount
    let kolTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
      connection,
      adminKp,
      mint,
      kolKp.publicKey
    );

    txHash = await program.methods
      .resolveDeal()
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: kolKp.publicKey,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        kolTokenAccount: kolTokenAccount.address,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed" });

    console.log(
      `KOL claimed ${max_claimable_after_obligation}% of the tokens. txHash: ${txHash}`
    );

    // KOL becomes fully eligible
    await program.methods
      .setEligibilityStatus({ fullyEligible: {} })
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    console.log("KOL is now fully eligible.");

    // Wait for the first delay (simulate time passage)
    console.log(`Waiting for ${firstClaimDelay / 1000} seconds...`);
    await sleep(firstClaimDelay);

    // KOL claims again after some time
    try {
      txHash = await program.methods
        .resolveDeal()
        .accounts({
          deal: dealPda,
          escrow: escrowPda,
          signer: kolKp.publicKey,
          vaultTokenAccount: vaultTokenAccountPda,
          vaultAuthority: vaultAuthorityPda,
          kolTokenAccount: kolTokenAccount.address,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
        })
        .signers([kolKp])
        .rpc({ commitment: "confirmed", skipPreflight: true });
    } catch (e) {
      console.log("Error while KOL claiming after first delay", e);
      throw e;
    }

    console.log(
      `KOL claimed more tokens after ${
        firstClaimDelay / 1000
      } seconds. txHash: ${txHash}`
    );

    // Wait for the second delay (simulate more time passing)
    console.log(`Waiting for ${secondClaimDelay / 1000} seconds...`);
    await sleep(secondClaimDelay);

    // KOL claims remaining tokens
    txHash = await program.methods
      .resolveDeal()
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: kolKp.publicKey,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        kolTokenAccount: kolTokenAccount.address,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
      })
      .signers([kolKp])
      .rpc({ commitment: "confirmed" });

    console.log(
      `KOL claimed all remaining tokens after ${
        secondClaimDelay / 1000
      } seconds. txHash: ${txHash}`
    );
  });

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
