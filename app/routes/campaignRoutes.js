import {
  CHAINS,
  MINIMUM_POST_LIVE_IN_MINUTES,
  OFFER_EXPIRY_IN_MINUTES,
  PARTIAL_UNLOCK_PERCENTAGE,
  VESTING_CONFIG,
} from "../../config.js";
import { prismaClient } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  validateOfferData,
  validateVestingCondition,
} from "../utils/campaignUtils.js";
import { getCreateDealTxDetails } from "../lib/contract/mutualEscrowContract.js";
import {
  formatTokenAmount,
  parseAccountData,
  prepareOrderId,
  validateTokenAmount,
} from "../utils/contractUtils.js";
import { adminKp, MUTUAL_ESCROW_PROGRAM } from "../lib/contract/contracts.js";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import { manyMinutesFromNowUnix } from "../utils/miscUtils.js";
import { approveOrder, generateEventLogs } from "../workers/helpers/campaignHelpers.js";
import { validateRequiredFields } from "../utils/validationUtils.js";
import { unTwitterApiGetTweet } from "../api/unTwitterApi/unTwitterApi.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const campaignRoutes = (app, _, done) => {
  // Validate the offer data before creating the offer, this is called before the user called the create_deal function on the contract
  // Endpoint for validation only
  app.post(
    "/create-offer-check",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      const { user } = req;
      const validationResult = await validateOfferData(req, reply);

      if (!validationResult.success) {
        return reply.status(400).send({
          message: validationResult.message,
        });
      } else {
        return reply.status(200).send({
          message: "Offer data is valid",
        });
      }
    }
  );

  // Create an offer to the KOL
  app.post(
    "/create-offer",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      try {
        // This endpoint will be called AFTER the user has called the create_deal function on the contract and the transaction is confirmed.
        // orderId is generated by the frontend and is unique, it is used to identify the order to link between the backend and the contract
        const { user } = req;
        console.log("User:", user);

        const validationResult = await validateOfferData(req, reply, true);
        if (!validationResult.success) return;

        const {
          orderId,
          vestingType,
          vestingCondition,
          influencerId,
          chainId = "devnet",
          mintAddress,
          createDealTxHash,
          tokenAmount,
          campaignChannel = "TWITTER",
        } = req.body;

        const chain = CHAINS.find((c) => c.id === chainId);
        if (!chain) {
          return reply.status(400).send({ message: "Invalid chain ID" });
        }

        console.log(
          "Order Validated, proceed to confirm the deal on the contract"
        );

        const dealAccountData = await getCreateDealTxDetails(
          createDealTxHash,
          chainId
        ).catch((e) => {
          return reply.status(400).send({
            message: `Invalid create deal transaction. Please check if the transaction hash is correct and the transaction is confirmed. TxHash: ${createDealTxHash}`,
          });
        });

        // Check if the orderId is the same as the one in the contract
        if (orderId !== dealAccountData.orderId) {
          return reply.status(400).send({ message: "Order ID mismatch" });
        }

        // Check if mintAddress is the same as the one in the contract
        if (mintAddress.toLowerCase() !== dealAccountData.mint.toLowerCase()) {
          return reply.status(400).send({ message: "Mint address mismatch" });
        }

        // Check if the vestingType is the same as the one in the contract
        if (
          vestingType.toLowerCase() !==
          dealAccountData.vestingType.toLowerCase()
        ) {
          return reply.status(400).send({ message: "Vesting type mismatch" });
        }

        const token = await prismaClient.token.findUnique({
          where: {
            mintAddress_chainId: {
              mintAddress: mintAddress,
              chainId: chain.dbChainId,
            },
          },
        });
        if (!token) {
          return reply.status(400).send({ message: "Token not found" });
        }

        // Check is the amount is the same as the one in the contract
        const clientAmount = tokenAmount;
        const contractAmount = dealAccountData.amount;
        const validateAmount = validateTokenAmount(
          clientAmount,
          contractAmount,
          token.decimals
        );

        if (!validateAmount.isValid) {
          return reply.status(400).send({ message: validateAmount.message });
        }

        const projectOwner = await prismaClient.projectOwner.findUnique({
          where: {
            userId: user.id,
          },
        });
        if (!projectOwner) {
          return reply.status(400).send({ message: "Project owner not found" });
        }

        console.log("Project Owner:", projectOwner);

        const expiry = manyMinutesFromNowUnix(OFFER_EXPIRY_IN_MINUTES);

        // Insert the offer to the database
        const offer = await prismaClient.campaignOrder.create({
          data: {
            id: orderId,
            influencerId: influencerId,
            projectOwnerId: projectOwner.id,
            chainId: chain.dbChainId,
            tokenId: token.id,
            tokenAmount: tokenAmount,
            channel: campaignChannel.toUpperCase(),
            vestingType: vestingType.toUpperCase(),
            vestingCondition: vestingCondition,
            expiredAtUnix: expiry,
          },
        });

        console.log("Offer created:", offer);

        return reply.status(200).send(offer);
      } catch (error) {
        console.error("Error creating offer:", error);
        return reply
          .status(500)
          .send({ message: error?.message || "Internal server error" });
      }
    }
  );

  // KOL accepts the deal
  app.post(
    "/accept-offer",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const { user } = request;
        console.log('userz', user)
        const { orderId } = request.body;

        const kol = await prismaClient.influencer.findUnique({
          where: {
            userId: user.id,
          },
          include: {
            user: {
              include: {
                wallet: true,
              },
            },
          },
        });
        if (!kol) {
          return reply.status(400).send({ message: "KOL not found" });
        }

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
            influencerId: kol.id,
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
            token: true,
          },
        });

        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        // Call the contract to accept the deal
        const orderChain = CHAINS.find((c) => c.dbChainId === order.chainId);
        const program = MUTUAL_ESCROW_PROGRAM(orderChain.id);

        const orderIdBuffer = prepareOrderId(order.id);
        const kolPublicKey = new PublicKey(kol.user.wallet.address);
        const projectOwnerPublicKey = new PublicKey(
          order.projectOwner.user.wallet.address
        );
        const mintPublicKey = new PublicKey(order.token.mintAddress);

        console.log({
          orderIdBuffer,
          kolPublicKey,
          projectOwnerPublicKey,
          mintPublicKey,
        });

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

        console.log("dealPda:", dealPda.toBase58());
        console.log("escrowPda:", escrowPda.toBase58());

        // Call the accept deal function on the contract
        const txHash = await program.methods
          .acceptDeal()
          .accounts({
            deal: dealPda,
            escrow: escrowPda,
            signer: adminKp.publicKey,
          })
          .signers(adminKp)
          .rpc({
            commitment: "confirmed",
          });
        console.log("accept deal txHash:", txHash);

        // Update the order status to accepted
        const acceptedOrder = await prismaClient.campaignOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "ACCEPTED",
          },
        });

        reply.send(acceptedOrder);
      } catch (error) {
        console.error("Error accepting offer:", error);
        return reply
          .status(500)
          .send({ message: error?.message || "Internal server error" });
      }
    }
  );

  // KOL rejects the deal
  app.post(
    "/reject-offer",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const { user } = request;
        const { orderId } = request.body;

        const kol = await prismaClient.influencer.findUnique({
          where: {
            userId: user.id,
          },
          include: {
            user: {
              include: {
                wallet: true,
              },
            },
          },
        });
        if (!kol) {
          return reply.status(400).send({ message: "KOL not found" });
        }

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
            influencerId: kol.id,
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
            token: true,
          },
        });

        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        // Call the contract to reject the deal
        const orderChain = CHAINS.find((c) => c.dbChainId === order.chainId);
        const program = MUTUAL_ESCROW_PROGRAM(orderChain.id);

        const orderIdBuffer = prepareOrderId(order.id);
        const kolPublicKey = new PublicKey(kol.user.wallet.address);
        const projectOwnerPublicKey = new PublicKey(
          order.projectOwner.user.wallet.address
        );
        const mintPublicKey = new PublicKey(order.token.mintAddress);

        console.log({
          orderIdBuffer,
          kolPublicKey,
          projectOwnerPublicKey,
          mintPublicKey,
        });

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
        console.log("projectOwnerTokenAccount:", projectOwnerTokenAccount);

        console.log("dealPda:", dealPda.toBase58());
        console.log("escrowPda:", escrowPda.toBase58());

        // Call the reject deal function on the contract
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
        const rejectedOrder = await prismaClient.campaignOrder.update({
          where: {
            id: order.id,
          },
          data: {
            status: "REJECTED",
          },
        });

        reply.send(rejectedOrder);
      } catch (error) {
        console.error("Error rejecting deal:", error);
        return reply
          .status(500)
          .send({ message: error?.message || "Internal server error" });
      }
    }
  );

  app.get(
    "/orders",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const { user } = request;
        const ordersInfluencer = await prismaClient.campaignOrder.findMany({
          where: {
            influencer: {
              userId: user.id,
            },
          },
          include: {
            influencer: {
              include: {
                user: true,
              },
            },
            projectOwner: {
              include: {
                user: true,
                projectDetails: {
                  select: {
                    id: true,
                    contractAddress: true,
                    token: {
                      select: {
                        id: true,
                        imageUrl: true,
                        holderCount: true,
                        decimals: true,
                        name: true,
                        symbol: true,
                        description: true,
                      }
                    }
                  }
                },
              },
            },
            token: true,
            post: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const ordersProjectOwner = await prismaClient.campaignOrder.findMany({
          where: {
            projectOwner: {
              userId: user.id,
            },
          },
          include: {
            projectOwner: {
              include: {
                user: true,
              },
            },
            influencer: {
              include: {
                user: true,
                twitterAccount: true,
              },
            },
            token: true,
            post: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        let orders = [];
        if (ordersInfluencer?.length > 0) {
          // console.log("Using influencer orders");
          orders = ordersInfluencer;
        } else if (ordersProjectOwner?.length > 0) {
          // console.log("Using project owner orders");
          orders = ordersProjectOwner;
        }

        return reply.send(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        return reply.status(500).send({
          message: error?.message || "Internal server error",
        });
      }
    }
  );

  app.get(
    "/:orderId/detail",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      try {
        const { user } = req;
        const { orderId } = req.params;

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
          },
          include: {
            influencer: {
              include: {
                user: {
                  include: {
                    wallet: true,
                  },
                },
                twitterAccount: true,
              },
            },
            projectOwner: {
              include: {
                user: {
                  include: {
                    wallet: true,
                  },
                },
                projectDetails: {
                  select: {
                    id: true,
                    token: {
                      select: {
                        id: true,
                        imageUrl: true,
                        mintAddress: true,
                        symbol: true,
                        name: true,
                        totalSupply: true,
                        pair: {
                          select: {
                            marketCap: true,
                            priceUsd: true,
                            url: true,
                          }
                        }
                      }
                    }
                  }
                }
              },
            },
            token: true,
            post: true,
          },
        });

        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        return reply.send(order);
      } catch (error) {
        console.error("Error fetching order detail:", error);
        return reply.status(500).send({
          message: error?.message || "Internal server error",
        });
      }
    }
  );

  app.get("/:orderId/logs", async (req, reply) => {
    try {
      const { orderId } = req.params;

      const order = await prismaClient.campaignOrder.findUnique({
        select: {
          id: true,
        },
        where: {
          id: orderId,
        },
      });

      if (!order) {
        return reply.status(400).send({ message: "Order not found" });
      }

      const logs = await generateEventLogs(order.id);

      return reply.send(logs);
    } catch (error) {
      console.error("Error fetching contract logs:", error);
      return reply.status(500).send({
        message: error?.message || "Internal server error",
      });
    }
  });

  app.post(
    "/submit-work",
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      try {
        await validateRequiredFields(
          request.body,
          ["orderId", "twitterPostLink"],
          reply
        );

        const { user } = request;
        const { twitterPostLink, orderId } = request.body;

        // KOL submits the task (tweet, post, etc.) for verification by the Project Owner

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
            influencer: {
              userId: user.id,
            },
          },
        });

        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        const tweetId = twitterPostLink.split("/").pop();
        console.log("Tweet ID:", tweetId);

        if (!tweetId) {
          return reply.status(400).send({ message: "Invalid tweet link" });
        }

        const tweet = await unTwitterApiGetTweet({
          tweetId: tweetId,
        }).catch((e) => {
          console.error("Error fetching tweet:", e);
          return reply
            .status(400)
            .send({ message: "Error while fetching tweet" });
        });

        if (!tweet) {
          return reply.status(400).send({ message: "Tweet not found" });
        }

        console.log("Tweet:", tweet);

        // TODO: Check is the poster the same as the KOL verified twitter account

        // Update the campaign post
        const posted = await prismaClient.campaignPost.upsert({
          where: {
            campaignOrderId: order.id,
          },
          create: {
            campaignOrderId: order.id,
            postId: tweet.tweet.id_str,
            postUrl: twitterPostLink,
            postedTimeUnix: tweet.tweet.created_at,
            text: tweet.tweet.full_text,
            data: tweet.tweet,
            impressionData: {
              favourite_count: tweet.tweet.favorite_count,
              quote_count: tweet.tweet.quote_count,
              reply_count: tweet.tweet.reply_count,
              retweet_count: tweet.tweet.retweet_count,
              view_count: tweet.tweet.view_count,
            },
          },
          update: {
            postId: tweet.tweet.id_str,
            postUrl: twitterPostLink,
            postedTimeUnix: tweet.tweet.created_at,
            text: tweet.tweet.full_text,
            data: tweet.tweet,
            impressionData: {
              favourite_count: tweet.tweet.favorite_count,
              quote_count: tweet.tweet.quote_count,
              reply_count: tweet.tweet.reply_count,
              retweet_count: tweet.tweet.retweet_count,
              view_count: tweet.tweet.view_count,
            },
          },
        });

        return reply.send(posted);
      } catch (error) {
        console.error("Error submitting work:", error);
        return reply.status(500).send({
          message: "Internal server error",
        });
      }
    }
  );

  // KOL confirms that the obligated task is done
  app.post(
    "/approve-work",
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      try {
        const { user } = request;
        const { orderId } = request.body;
        // Project Owner confirms the task (tweet, post, etc.). On-demand verification is done here.

        // If the task is done, call the contract to make the eligibility partial (for vesting), for none, full eligibility
        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
            projectOwner: {
              userId: user.id,
            },
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
        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        if (order.post.isApproved) {
          return reply.status(400).send({ message: "Work already approved" });
        }

        console.log("Order:", order);

        let isPartial = false;
        if (order.vestingType === 'MARKETCAP') {
          isPartial = true;
        }

        await approveOrder(order.id, isPartial);

        return reply.send({ message: "Work approved" });
      } catch (error) {
        console.error("Error confirming work:", error);
      }
    }
  );

  app.post(
    "/:orderId/claim",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      try {
        const { user } = req;
        console.log("Claiming tokens");

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: req.params.orderId,
            influencer: {
              userId: user.id,
            },
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
          },
        });

        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }
        const chain = CHAINS.find((c) => c.dbChainId === order.chainId);

        const orderIdBuffer = prepareOrderId(order.id);

        const kolPublicKey = new PublicKey(
          order.influencer.user.wallet.address
        );
        const projectOwnerPublicKey = new PublicKey(
          order.projectOwner.user.wallet.address
        );
        const mintPublicKey = new PublicKey(order.token.mintAddress);

        const program = MUTUAL_ESCROW_PROGRAM(chain.id);

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

        const kolTokenAccount = await splToken.getAssociatedTokenAddress(
          mintPublicKey,
          kolPublicKey
        );

        const txHash = await program.methods
          .resolveDeal()
          .accounts({
            deal: dealPda,
            escrow: escrowPda,
            signer: adminKp.publicKey,
            vaultTokenAccount: vaultTokenAccountPda,
            vaultAuthority: vaultAuthorityPda,
            kolTokenAccount: kolTokenAccount,
            tokenProgram: splToken.TOKEN_PROGRAM_ID,
          })
          .signers([adminKp])
          .rpc({ commitment: "confirmed" });
        console.log("Claim txHash:", txHash);

        // TODO: Claimed amount

        return reply.send({
          txHash: txHash,
          claimedAmount: 123456,
        });
      } catch (error) {
        console.error("Error claiming tokens:", error);
        return reply.status(500).send({
          message: error?.message || "Internal server error",
        });
      }
    }
  );

  app.get(
    "/:orderId/claimable",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      try {
        // Check if the KOL can claim tokens (fully or partially). Show the amount of tokens that can be claimed.
        const { orderId } = req.params;

        const order = await prismaClient.campaignOrder.findUnique({
          where: {
            id: orderId,
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
            token: {
              select: {
                mintAddress: true,
                chainId: true,
                decimals: true,
                imageUrl: true,
                name: true,
                symbol: true,
              },
            },
          },
        });
        if (!order) {
          return reply.status(400).send({ message: "Order not found" });
        }

        const chain = CHAINS.find((c) => c.dbChainId === order.chainId);
        if (!chain) {
          return reply.status(400).send({ message: "Invalid chain ID" });
        }
        const orderIdBuffer = prepareOrderId(order.id);
        const kolPublicKey = new PublicKey(
          order.influencer.user.wallet.address
        );
        const projectOwnerPublicKey = new PublicKey(
          order.projectOwner.user.wallet.address
        );
        const mintPublicKey = new PublicKey(order.token.mintAddress);

        const program = MUTUAL_ESCROW_PROGRAM(chain.id);

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

        const dealData = await program.account.deal.fetch(dealPda);
        const dealSchema = program.idl.accounts.find((a) => a.name === "Deal");
        // console.log("Deal Data:", parseAccountData(dealData, dealSchema));
        const parsedDealData = parseAccountData(dealData, dealSchema);
        console.log("Parsed Deal Data:", parsedDealData);

        // Call the check_claimable_amount instruction on the program
        const claimableAmount = await program.methods
          .checkClaimableAmount()
          .accounts({
            deal: dealPda,
            escrow: escrowPda,
          })
          .view({
            commitment: "confirmed",
          });
          // .simulate({
          //   skipPreflight: true,
          // })

        // Format it into the token { mintAddress: ..., amount: claimableAmount/10^decimals, ...}
        const formattedAmount = new BN(claimableAmount).div(
          new BN(10).pow(new BN(order.token.decimals))
        ) || claimableAmount * 10 ** order.token.decimals;

        // parsedDealData.eligibilityStatus = "fullyEligible"; // Fully Eligible

        let claimInfo = {};

        let claimed = {
          amount: formatTokenAmount(parsedDealData.releasedAmount, order.token.decimals),
          name: order.token.name,
          symbol: order.token.symbol,
        }

        const isNotEligible =
          parsedDealData.eligibilityStatus === "notEligible";
        const isPartiallyEligible =
          parsedDealData.eligibilityStatus === "partiallyEligible";
        const isFullyEligible =
          parsedDealData.eligibilityStatus === "fullyEligible";

        // Calculate the partial and total unlock amounts
        const partialUnlockAmount =
          (order.tokenAmount * PARTIAL_UNLOCK_PERCENTAGE) / 100;
        const totalAmount = order.tokenAmount;

        // Common logic for both NONE and MARKETCAP vesting types
        const canClaimPartial =
          isPartiallyEligible && new BN(claimableAmount).gt(new BN(0));
        const canClaimFull =
          isFullyEligible && new BN(claimableAmount).gt(new BN(0));

        let mediaLabel;
        if (order.channel === "TWITTER") {
          mediaLabel = "Tweet";
        } else if (order.channel === "TELEGRAM") {
          mediaLabel = "Telegram Post";
        }

        if (parsedDealData.amount === parsedDealData.releasedAmount) {
          claimInfo = {
            phases: [],
            isClaimedAll: true,
            claimed: claimed
          };
        } else {
          if (order.vestingType === "NONE") {
            // NONE-based vesting logic
            if (isPartiallyEligible || isNotEligible) {
              // Can claim all tokens in one phase
              claimInfo = {
                phases: [
                  {
                    phaseName: "Final Unlock",
                    amount: totalAmount,
                    amountLabel: `${totalAmount} $${order.token.symbol}`,
                    conditionLabel: `Claimable ${MINIMUM_POST_LIVE_IN_MINUTES / 60
                      } hours after the ${mediaLabel} is posted`,
                    isClaimable: false,
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else if (isFullyEligible) {
              // Can claim all tokens in one phase
              claimInfo = {
                phases: [
                  {
                    phaseName: "Final Unlock",
                    amount: totalAmount,
                    amountLabel: `${totalAmount} $${order.token.symbol}`,
                    conditionLabel: `You can claim the full amount of ${totalAmount} tokens now.`,
                    isClaimable: canClaimFull,
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else {
              console.log(
                "Invalid eligibility status:",
                parsedDealData.eligibilityStatus
              );
            }
          } else if (order.vestingType === "MARKETCAP") {
            // Market Cap-based vesting logic
            if (isPartiallyEligible || isNotEligible) {
              // TODO: Marketcap label
              claimInfo = {
                phases: [
                  {
                    phaseName: "First Unlock",
                    amount: partialUnlockAmount,
                    amountLabel: `${partialUnlockAmount} $${order.token.symbol}`,
                    conditionLabel: `Claim after the ${mediaLabel} is posted`,
                    isClaimable: canClaimPartial,
                  },
                  {
                    phaseName: "Final Unlock",
                    amount: totalAmount - partialUnlockAmount,
                    amountLabel: `${totalAmount - partialUnlockAmount} $${order.token.symbol
                      }`,
                    conditionLabel: `Claim after $${order.token.symbol} reaches the target market cap`,
                    isClaimable: false,
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else if (isFullyEligible) {
              // Can claim all tokens in one phase
              claimInfo = {
                phases: [
                  {
                    phaseName: "Final Unlock",
                    amount: totalAmount,
                    amountLabel: `${totalAmount} $${order.token.symbol}`,
                    conditionLabel: `You can claim the full amount of ${totalAmount} tokens now.`,
                    isClaimable: canClaimFull,
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else {
              console.log(
                "Invalid eligibility status:",
                parsedDealData.eligibilityStatus
              );
            }
          } else if (order.vestingType === "TIME") {
            // Time-based vesting logic
            if (isPartiallyEligible || isNotEligible) {
              claimInfo = {
                phases: [
                  {
                    phaseName: "First Unlock",
                    amount: partialUnlockAmount,
                    amountLabel: `${partialUnlockAmount} $${order.token.symbol}`,
                    conditionLabel: `Claim after the ${mediaLabel} is posted`,
                    isClaimable: canClaimPartial,
                  },
                  {
                    phaseName: "Final Unlock",
                    amount: totalAmount - partialUnlockAmount,
                    amountLabel: `${totalAmount - partialUnlockAmount} $${order.token.symbol
                      } `,
                    conditionLabel: `Claim after the vesting period ends`,
                    isClaimable: false,
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else if (isFullyEligible) {
              // Can claim all tokens in one phase
              // TODO: Dynamic labelling because the time-based vesting can have different claimable amounts
              claimInfo = {
                phases: [
                  {
                    phaseName: "Time-vested unlock",
                    amount: formattedAmount,
                    amountLabel: `${formattedAmount} $${order.token.symbol} `,
                    conditionLabel: `You can claim ${formattedAmount} tokens now. The remaining tokens will be claimable after the vesting period ends.`,
                    isClaimable: true
                  },
                ],
                isClaimedAll: false,
                claimed: claimed
              };
            } else {
              console.log(
                "Invalid eligibility status:",
                parsedDealData.eligibilityStatus
              );
            }
          }
        }

        reply.send(claimInfo);
      } catch (error) {
        console.error("Error checking claimable tokens:", error);
        return reply.status(500).send({
          message: error?.message || "Internal server error",
        });
      }
    }
  );

  // Check if the task was fulfilled (backend admin verifies)
  app.post(
    "/verify-task",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      // Backend verifies if the task was fulfilled and calls partial eligibility on the contract
      reply.send("OK");
    }
  );

  // Deal is marked as finished (after the final claim)
  app.post(
    "/finish-deal",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      // Mark the deal as finished when all conditions are met and tokens are claimed
      reply.send("OK");
    }
  );

  done();
};
