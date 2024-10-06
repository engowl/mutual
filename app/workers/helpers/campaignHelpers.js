import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { CHAINS, MINIMUM_POST_LIVE_IN_MINUTES } from "../../../config.js";
import { prismaClient } from "../../db/prisma.js";
import { adminKp, MUTUAL_ESCROW_PROGRAM } from "../../lib/contract/contracts.js";
import { prepareOrderId } from "../../utils/contractUtils.js";
import { BN } from "bn.js";
import { nanoid } from "nanoid";

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

export const generateEventLogs = async (orderId) => {
  console.log('Generating event logs for order:', orderId);

  const order = await prismaClient.campaignOrder.findUnique({
    where: {
      id: orderId
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

  // Fetch contract logs for the order
  let events = await prismaClient.escrowEventLog.findMany({
    where: {
      campaignOrderId: order.id,
      chainId: order.chainId
    },
    orderBy: [
      {
        createdAt: 'asc'
      },
      {
        slot: 'asc'
      }
    ]
  });
  const createdOfferTx = events.find(e => e.eventName === 'DealCreated');
  // Remove the created offer event
  events = events.filter(e => e.eventName !== 'DealCreated');

  const logs = []

  let vestingLabel = '';
  if (order.vestingType === 'MARKETCAP') {
    vestingLabel = `Market-cap vesting terms for $${order.token.symbol}.`;
  } else if (order.vestingType === 'TIME') {
    vestingLabel = `Time-based vesting terms for $${order.token.symbol}.`;
  } else if (order.vestingType === 'NONE') {
    vestingLabel = `Direct token transfer for $${order.token.symbol}.`;
  } else {
    vestingLabel = `Unknown vesting terms for $${order.token.symbol}.`;
  }

  // Created offer log
  const createdOfferLog = {
    id: 'created_offer',
    title: 'Offer Created',
    description: `An offer was submitted with ${vestingLabel}`,
    time: order.createdAt,
    txHash: createdOfferTx.signature,
  };
  logs.push(createdOfferLog);

  for (const event of events) {
    console.log('Event:', event);

    if (event.eventName === 'DealStatusChanged') {
      if (event.data.status === 'accepted') {
        const log = {
          id: 'accepted_offer',
          description: 'The offer has been accepted. The post is scheduled for ...',
          time: event.createdAt,
          txHash: null
        };
        logs.push(log);
      } else if (event.data.status === 'rejected') {
        const log = {
          id: 'rejected_offer',
          description: 'The offer was rejected. A refund has been initiated.',
          time: event.createdAt,
          txHash: event.signature
        };
        logs.push(log);
      } else if (event.data.status === 'completed') {
        const log = {
          id: 'completed_offer',
          description: 'The offer is completed. All tokens have been released.',
          time: event.createdAt,
          txHash: null
        };
        logs.push(log);
      }
    } else if (event.eventName === 'EligibilityStatusUpdated') {
      if (event.data.newStatus === 'partiallyEligible') {
        // Check the first event with EligibilityStatusUpdated and status partiallyEligible
        let mediaLabel = '';
        if (order.channel === 'TELEGRAM') {
          mediaLabel = 'The Telegram post has been verified';
        } else if (order.channel === 'TWITTER') {
          mediaLabel = 'The tweet has been verified';
        }

        const log = {
          id: 'partially_eligible',
          description: `${mediaLabel}, the first unlock is now available for claiming.`,
          time: event.createdAt,
          txHash: event.signature
        };
        logs.push(log);
      } else if (event.data.newStatus === 'fullyEligible') {
        let vestingLabel = '';

        if (order.vestingType === 'MARKETCAP') {
          vestingLabel = `$${order.token.symbol} has reached the target market cap! All remaining tokens are now available for claiming.`;
        } else if (order.vestingType === 'TIME') {
          vestingLabel = `...`;
        } else if (order.vestingType === 'NONE') {
          vestingLabel = `All tokens are now available for claiming.`;
        } else {
          vestingLabel = `Eligibility conditions met. Tokens are available for claiming.`;
        }

        const log = {
          id: 'fully_eligible',
          description: vestingLabel,
          time: event.createdAt,
          txHash: event.signature
        };
        logs.push(log);
      }
    } else if (event.eventName === 'DealResolved') {
      if (event.data.status === 'partialCompleted') {
        const amount = new BN(event.data.claimAmount).div(new BN(10 ** order.token.decimals)).toNumber();
        const claimLabel = `A partial unlock of ${amount} $${order.token.symbol} has been claimed.`;

        const log = {
          id: `partial_deal_resolved_${nanoid(3)}`,
          description: claimLabel,
          time: event.createdAt,
          txHash: event.signature
        };
        logs.push(log);
      } else if (event.data.status === 'completed') {
        const amount = new BN(event.data.releasedAmount).div(new BN(10 ** order.token.decimals)).toNumber();
        const claimLabel = `All ${amount} $${order.token.symbol} has been claimed.`;

        const log = {
          id: 'deal_resolved',
          description: claimLabel,
          time: event.createdAt,
          txHash: event.signature
        };

        logs.push(log);
      }
    }
  }

  return logs;
}