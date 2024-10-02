// tests/mutual_escrow.js

const anchor = require('@project-serum/anchor');
const { Program } = require('@project-serum/anchor');
const { PublicKey, SystemProgram, Keypair } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const assert = require('chai').assert;

describe('mutual_escrow', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MutualEscrow;

  // Define keypairs for project owner and KOL
  const projectOwner = Keypair.generate();
  const kol = Keypair.generate();
  const marketcapAuthorizer = Keypair.generate(); // For market cap vesting

  // Token mint and accounts
  let mint = null;
  let projectOwnerTokenAccount = null;
  let kolTokenAccount = null;

  // PDAs
  let escrowPda = null;
  let escrowBump = null;
  let dealPda = null;
  let dealBump = null;
  let vaultPda = null;
  let vaultBump = null;

  it('Sets up test environment', async () => {
    // Airdrop SOL to project owner, KOL, and marketcapAuthorizer
    const airdropAmount = 2 * anchor.web3.LAMPORTS_PER_SOL;
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(projectOwner.publicKey, airdropAmount), 
      'confirmed'
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(kol.publicKey, airdropAmount),
      'confirmed'
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(marketcapAuthorizer.publicKey, airdropAmount),
      'confirmed'
    );

    // Create a new token mint and associated token accounts
    mint = await Token.createMint(
      provider.connection,
      projectOwner,
      projectOwner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    // Create token accounts for project owner and KOL
    projectOwnerTokenAccount = await mint.createAccount(projectOwner.publicKey);
    kolTokenAccount = await mint.createAccount(kol.publicKey);

    // Mint some tokens to the project owner's token account
    await mint.mintTo(
      projectOwnerTokenAccount,
      projectOwner.publicKey,
      [],
      1000000 // Amount in smallest unit (e.g., if decimals=9, this is 0.001 token)
    );
  });

  it('Initializes the escrow', async () => {
    // Derive the escrow PDA
    [escrowPda, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from('escrow')],
      program.programId
    );

    // Initialize the escrow account
    await program.methods
      .initialize(escrowBump)
      .accounts({
        escrow: escrowPda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Fetch the escrow account data
    const escrowAccount = await program.account.escrow.fetch(escrowPda);

    assert.ok(escrowAccount.admin.equals(provider.wallet.publicKey));
    assert.equal(escrowAccount.escrowBump, escrowBump);
  });

  it('Creates a deal', async () => {
    // Deal amount and vesting parameters
    const dealAmount = new anchor.BN(500000); // Half of the minted tokens
    const vestingType = { marketcap: {} }; // Using Marketcap vesting
    const vestingDuration = new anchor.BN(0); // Not used for market cap vesting

    // Derive the deal PDA
    [dealPda, dealBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from('deal'),
        projectOwner.publicKey.toBuffer(),
        kol.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );

    // Derive the vault PDA
    [vaultPda, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from('vault'), mint.publicKey.toBuffer()],
      program.programId
    );

    // Create the deal
    await program.methods
      .createDeal(
        dealAmount,
        vestingType,
        vestingDuration,
        dealBump,
        marketcapAuthorizer.publicKey
      )
      .accounts({
        escrow: escrowPda,
        deal: dealPda,
        projectOwner: projectOwner.publicKey,
        kol: kol.publicKey,
        mint: mint.publicKey,
        projectOwnerTokenAccount: projectOwnerTokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([projectOwner])
      .rpc();

    // Fetch the deal account data
    const dealAccount = await program.account.deal.fetch(dealPda);

    assert.ok(dealAccount.projectOwner.equals(projectOwner.publicKey));
    assert.ok(dealAccount.kol.equals(kol.publicKey));
    assert.ok(dealAccount.mint.equals(mint.publicKey));
    assert.ok(dealAccount.amount.eq(dealAmount));
    assert.deepEqual(dealAccount.status, { created: {} });
  });

  it('KOL accepts the deal', async () => {
    await program.methods
      .acceptDeal()
      .accounts({
        escrow: escrowPda,
        deal: dealPda,
        kol: kol.publicKey,
      })
      .signers([kol])
      .rpc();

    // Fetch the deal account data
    const dealAccount = await program.account.deal.fetch(dealPda);

    assert.deepEqual(dealAccount.status, { accepted: {} });
  });

  it('Releases payment to KOL after market cap authorization', async () => {
    const releaseAmount = new anchor.BN(500000); // Release the full amount

    // Simulate market cap authorization
    // In a real scenario, this would be triggered by an external event
    await program.methods
      .releasePayment(releaseAmount)
      .accounts({
        escrow: escrowPda,
        deal: dealPda,
        vault: vaultPda,
        kolTokenAccount: kolTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        marketcapAuthorizer: marketcapAuthorizer.publicKey,
      })
      .signers([marketcapAuthorizer])
      .rpc();

    // Fetch the deal account data
    const dealAccount = await program.account.deal.fetch(dealPda);

    assert.ok(dealAccount.releasedAmount.eq(releaseAmount));
    assert.deepEqual(dealAccount.status, { completed: {} });

    // Check the KOL's token balance
    const kolTokenAccountInfo = await mint.getAccountInfo(kolTokenAccount);
    assert.ok(kolTokenAccountInfo.amount.eq(releaseAmount));
  });
});
