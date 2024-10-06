import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { CHAINS } from "../../../config.js";
import { prismaClient } from "../../db/prisma.js";
import { adminKp, MUTUAL_ESCROW_PROGRAM } from "../../lib/contract/contracts.js";
import { prepareOrderId } from "../../utils/contractUtils.js";

export const handleExpiredOffer = async (offerId) => {
  try {
    console.log('handling expired offer', offerId);

    const offer = await prismaClient.campaignOrder.findUnique({
      where: {
        id: offerId
      },
      include: {
        influencer: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        },
        projectOwner: {
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        },
        token: true
      }
    });

    const orderChain = CHAINS.find(c => c.dbChainId === offer.chainId);
    if (!orderChain) {
      console.log('Chain not found:', offer.chainId);
      return;
    }
    const program = MUTUAL_ESCROW_PROGRAM(orderChain.id);

    const orderIdBuffer = prepareOrderId(offer.id);
    const kolPublicKey = new PublicKey(offer.influencer.user.wallet.address);
    const projectOwnerPublicKey = new PublicKey(offer.projectOwner.user.wallet.address);
    const mintPublicKey = new PublicKey(offer.token.mintAddress);

    const [dealPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("deal"),
        orderIdBuffer,
        projectOwnerPublicKey.toBuffer(),
        kolPublicKey.toBuffer(),
        mintPublicKey.toBuffer(),
      ],
      program.programId
    );
    const [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow")],
      program.programId
    );

    const [vaultTokenAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_token_account"), mintPublicKey.toBuffer()],
      program.programId
    );

    const [vaultAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault_authority")],
      program.programId
    );

    const projectOwnerTokenAccount =
      await splToken.getAssociatedTokenAddress(
        mintPublicKey,
        projectOwnerPublicKey
      );

    if (!offer) {
      console.log('Offer not found:', offerId);
      return;
    }

    // console.log('Offer:', offer);
    console.log("dealPda:", dealPda.toBase58());
    console.log("escrowPda:", escrowPda.toBase58());

    const txHash = await program.methods
      .rejectDeal()
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
        projectOwner: projectOwnerPublicKey,
        vaultTokenAccount: vaultTokenAccountPda,
        vaultAuthority: vaultAuthorityPda,
        projectOwnerTokenAccount: projectOwnerTokenAccount,
        mint: mintPublicKey,
        tokenProgram: splToken.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([adminKp]) // Admin or KOL can sign
      .rpc({ commitment: "confirmed" });
    console.log("reject deal txHash:", txHash);

    // Update the order status to rejected
    await prismaClient.campaignOrder.update({
      where: {
        id: offer.id
      },
      data: {
        status: "REJECTED",
      },
    });
  } catch (error) {
    console.error('Error handling expired offer:', error);
  }
}