import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { CHAINS, MINIMUM_POST_LIVE_IN_MINUTES } from "../../../config.js";
import { prismaClient } from "../../db/prisma.js";
import { adminKp, MUTUAL_ESCROW_PROGRAM } from "../../lib/contract/contracts.js";
import { formatTokenAmount, prepareOrderId } from "../../utils/contractUtils.js";
import { BN } from "bn.js";
import { nanoid } from "nanoid";
import { unTwitterApiGetTweet } from "../../api/unTwitterApi/unTwitterApi.js";
import { manyMinutesFromNowUnix, sleep } from "../../utils/miscUtils.js";

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
      // campaignOrderId: 'marketcaporderz',
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

  let logs = []

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
        const amount = formatTokenAmount(event.data.claimAmount, order.token.decimals);
        const claimLabel = `A partial unlock of ${amount} $${order.token.symbol} has been claimed.`;

        const log = {
          id: `partial_deal_resolved_${nanoid(3)}`,
          description: claimLabel,
          time: event.createdAt,
          txHash: event.signature
        };
        logs.push(log);
      } else if (event.data.status === 'completed') {
        const amount = formatTokenAmount(event.data.claimAmount, order.token.decimals);
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

  // Filter out duplicate 'accepted_offer' logs, keeping only the first one
  const acceptOfferLogs = logs.filter(l => l.id === 'accepted_offer');
  if (acceptOfferLogs.length > 1) {
    // Keep only the first 'accepted_offer' log and remove the rest
    logs = logs.filter(l => l.id !== 'accepted_offer');
    logs.push(acceptOfferLogs[0]); // Add the first accepted offer back to logs
  }

  // The 'fully_eligible' too
  const fullyEligibleLogs = logs.filter(l => l.id === 'fully_eligible');
  if (fullyEligibleLogs.length > 1) {
    logs = logs.filter(l => l.id !== 'fully_eligible');
    logs.push(fullyEligibleLogs[0]);
  }

  // Sort the logs by 'time' to preserve the original order
  logs.sort((a, b) => new Date(b.time) - new Date(a.time));

  return logs;
}

export const handleCheckCampaignPost = async (campaignId) => {
  try {
    const campaign = await prismaClient.campaignOrder.findUnique({
      where: {
        id: campaignId,
      },
      include: {
        projectOwner: {
          include: {
            user: {
              include: {
                wallet: true,
              },
            },
          },
        },
        influencer: {
          include: {
            user: {
              include: {
                wallet: true,
              },
            },
          },
        },
        token: true,
        post: true,
      },
    });

    // Get the current post
    if (campaign.channel === 'TWITTER') {
      const post = campaign.post;

      const tweet = await unTwitterApiGetTweet({
        tweetId: post.postId,
      });

      if (campaign.post.isApproved === false) {
        // Check if the tweet has been live for at least the minimum required time (MINIMUM_POST_LIVE_IN_MINUTES).
        // This is determined by comparing the current time (now) with the tweet's posted time (post.postedTimeUnix).
        // If the tweet has been live long enough, update isApproved to true in the database.
        let isApproved = false;
        const now = manyMinutesFromNowUnix(0);
        const intervalInMinutes = parseInt((now - post.postedTimeUnix) / 60);

        // Approve the post if it has been live for the minimum required duration
        if (intervalInMinutes >= MINIMUM_POST_LIVE_IN_MINUTES) {
          isApproved = true;
        }

        // If the post is now approved, update the database to reflect the new status
        if (isApproved) {
          await approveOrder(campaign.id);
        }
      }

      // Update the impression count
      await prismaClient.campaignPost.update({
        where: {
          id: post.id
        },
        data: {
          impressionData: {
            favourite_count: tweet.tweet.favorite_count,
            quote_count: tweet.tweet.quote_count,
            reply_count: tweet.tweet.reply_count,
            retweet_count: tweet.tweet.retweet_count,
            view_count: tweet.tweet.view_count
          },
          data: tweet.tweet,
        }
      })
    } else if (campaign.channel === 'TELEGRAM') {
      // TODO: Check the telegram post
    }

    await sleep(2000)
  } catch (error) {
    console.error('Error checking campaign post:', error);
  }
}

async function approveOrder(orderId) {
  // Find the order in your system (replace this with your logic for fetching an order by ID)
  const order = await prismaClient.campaignOrder.findUnique({
    where: { id: orderId },
    include: {
      projectOwner: {
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
        },
      },
      influencer: {
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
        },
      },
      token: true,
      post: true,
    },
  });

  const chain = CHAINS.find(c => c.dbChainId === order.chainId);
  const program = MUTUAL_ESCROW_PROGRAM(chain.id);

  const [dealPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("deal"),
      prepareOrderId(order.id),
      new PublicKey(order.projectOwner.user.wallet.address).toBuffer(),
      new PublicKey(order.influencer.user.wallet.address).toBuffer(),
      new PublicKey(order.token.mintAddress).toBuffer(),
    ],
    program.programId
  );

  const [escrowPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow")],
    program.programId
  );

  if (order.vestingType === "NONE" || order.vestingType === "TIME") {
    // Fully eligible
    const txHash = await program.methods
      .setEligibilityStatus({ fullyEligible: {} })
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    console.log("Fully eligible txHash:", txHash);

    await prismaClient.campaignOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "COMPLETED",
      },
    });
  } else {
    // Partially eligible (adjust this logic as needed for your specific partial eligibility flow)
    const txHash = await program.methods
      .setEligibilityStatus({ fullyEligible: {} }) // Change to partiallyEligible if needed
      .accounts({
        deal: dealPda,
        escrow: escrowPda,
        signer: adminKp.publicKey,
      })
      .signers([adminKp])
      .rpc({ commitment: "confirmed" });

    console.log("Partial eligibility txHash:", txHash);

    await prismaClient.campaignOrder.update({
      where: {
        id: order.id,
      },
      data: {
        status: "PARTIALCOMPLETED",
      },
    });
  }

  // Update post to approved
  await prismaClient.campaignPost.update({
    where: {
      campaignOrderId: order.id,
    },
    data: {
      isApproved: true,
    },
  });
}
