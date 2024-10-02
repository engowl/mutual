const anchor = require('@project-serum/anchor');
const { SystemProgram, Keypair, PublicKey } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, Token } = require('@solana/spl-token');
const assert = require('assert');

describe('mutual', () => {
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Mutual;

  let escrow, escrowBump;
  let mint, projectOwnerTokenAccount, kolTokenAccount;
  let projectOwner, kol, admin;
  let deal, dealBump;
  let vault, vaultBump;

  const amount = new anchor.BN(1000000000); // 1 token
  const vestingDuration = new anchor.BN(86400); // 1 day in seconds

  before(async () => {
    // Generate necessary keypairs
    projectOwner = anchor.web3.Keypair.generate();
    kol = anchor.web3.Keypair.generate();
    admin = anchor.web3.Keypair.generate();

    // Airdrop SOL to accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(projectOwner.publicKey, 10000000000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(kol.publicKey, 10000000000),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10000000000),
      "confirmed"
    );

    // Create mint and token accounts
    mint = await Token.createMint(
      provider.connection,
      projectOwner,
      projectOwner.publicKey,
      null,
      9,
      TOKEN_PROGRAM_ID
    );

    projectOwnerTokenAccount = await mint.createAccount(projectOwner.publicKey);
    kolTokenAccount = await mint.createAccount(kol.publicKey);

    // Mint tokens to project owner
    await mint.mintTo(
      projectOwnerTokenAccount,
      projectOwner.publicKey,
      [],
      amount.toNumber()
    );

    // Derive PDAs
    [escrow, escrowBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("escrow"))],
      program.programId
    );

    [vault, vaultBump] = await PublicKey.findProgramAddress(
      [Buffer.from(anchor.utils.bytes.utf8.encode("vault")), mint.publicKey.toBuffer()],
      program.programId
    );

    [deal, dealBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from(anchor.utils.bytes.utf8.encode("deal")),
        projectOwner.publicKey.toBuffer(),
        kol.publicKey.toBuffer(),
        mint.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  it('Initializes the escrow', async () => {
    await program.rpc.initialize(
      escrowBump,
      vaultBump,
      {
        accounts: {
          escrow,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [admin],
      }
    );

    const escrowAccount = await program.account.escrow.fetch(escrow);
    assert.ok(escrowAccount.admin.equals(admin.publicKey));
  });

  it('Creates a deal', async () => {
    await program.rpc.createDeal(
      amount,
      { time: {} },
      vestingDuration,
      dealBump,
      {
        accounts: {
          escrow,
          deal,
          projectOwner: projectOwner.publicKey,
          kol: kol.publicKey,
          mint: mint.publicKey,
          projectOwnerTokenAccount,
          vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        },
        signers: [projectOwner],
      }
    );

    const dealAccount = await program.account.deal.fetch(deal);
    assert.ok(dealAccount.projectOwner.equals(projectOwner.publicKey));
    assert.ok(dealAccount.kol.equals(kol.publicKey));
    assert.ok(dealAccount.amount.eq(amount));
  });

  it('Accepts the deal', async () => {
    await program.rpc.acceptDeal(
      {
        accounts: {
          escrow,
          deal,
          kol: kol.publicKey,
        },
        signers: [kol],
      }
    );

    const dealAccount = await program.account.deal.fetch(deal);
    assert.equal(dealAccount.status.accepted.toString(), '{}');
  });

  it('Releases payment', async () => {
    // Wait for some time to pass
    await new Promise(resolve => setTimeout(resolve, 5000));

    const releaseAmount = new anchor.BN(500000000); // 0.5 token

    await program.rpc.releasePayment(
      releaseAmount,
      {
        accounts: {
          escrow,
          deal,
          vault,
          kolTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
      }
    );

    const kolBalance = await provider.connection.getTokenAccountBalance(kolTokenAccount);
    assert.equal(kolBalance.value.amount, releaseAmount.toString());
  });

  it('Disputes the deal', async () => {
    await program.rpc.disputeDeal(
      "Service not delivered as promised",
      {
        accounts: {
          escrow,
          deal,
          disputer: projectOwner.publicKey,
        },
        signers: [projectOwner],
      }
    );

    const dealAccount = await program.account.deal.fetch(deal);
    assert.equal(dealAccount.status.disputed.toString(), '{}');
  });

  it('Resolves the dispute', async () => {
    const resolutionAmount = new anchor.BN(250000000); // 0.25 token to KOL

    await program.rpc.resolveDispute(
      { custom: resolutionAmount },
      {
        accounts: {
          escrow,
          deal,
          vault,
          kolTokenAccount,
          projectOwnerTokenAccount,
          admin: admin.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [admin],
      }
    );

    const dealAccount = await program.account.deal.fetch(deal);
    assert.equal(dealAccount.status.resolved.toString(), '{}');

    const kolBalance = await provider.connection.getTokenAccountBalance(kolTokenAccount);
    assert.equal(kolBalance.value.amount, resolutionAmount.add(new anchor.BN(500000000)).toString());

    const projectOwnerBalance = await provider.connection.getTokenAccountBalance(projectOwnerTokenAccount);
    assert.equal(projectOwnerBalance.value.amount, '250000000');
  });
});