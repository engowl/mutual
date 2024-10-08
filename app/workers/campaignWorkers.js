import bs58 from "bs58";
import solanaWeb3 from "@solana/web3.js";
import cron from "node-cron";
import { CHAINS, OFFER_EXPIRY_IN_MINUTES } from "../../config.js";
import { MUTUAL_ESCROW_PROGRAM } from "../lib/contract/contracts.js";
import {
  getAlphanumericId,
  manyMinutesFromNowUnix,
} from "../utils/miscUtils.js";
import { parseEventData } from "../utils/contractUtils.js";
import { prismaClient } from "../db/prisma.js";
import {
  handleCheckCampaignPost,
  handleExpiredOffer,
} from "./helpers/campaignHelpers.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {Function} done
 */
export const campaignWorkers = (app, _, done) => {
  const parseKp = () => {
    const kp = []; // Fill this with your keypair data
    const keypair = solanaWeb3.Keypair.fromSecretKey(
      bs58.decode(bs58.encode(Buffer.from(kp)))
    );

    console.group("Keypair Details");
    console.log("Address:", keypair.publicKey.toBase58());
    console.log("Secret Key (Base58):", bs58.encode(keypair.secretKey));
    console.groupEnd();
  };

  const saveEscrowEventLog = async ({
    chainId,
    programId,
    eventName,
    signature,
    parsedEvent,
    slot,
  }) => {
    try {
      await prismaClient.escrowEventLog.create({
        data: {
          chainId: chainId,
          programId: programId,
          campaignOrderId: parsedEvent.orderId,
          eventName: eventName,
          signature: signature,
          data: parsedEvent,
          slot: slot,
        },
      });
      console.log("Escrow event log saved successfully");
    } catch (error) {
      console.error("Error saving escrow event log:", error.stack || error);
    }
  };

  const handleEvent = async ({
    chain,
    program,
    eventName,
    event,
    slot,
    signature,
  }) => {
    try {
      console.group(`Event: ${eventName}`);
      console.log(`New event detected: ${eventName}`);
      console.log("Event data:", event);
      console.log("Slot:", slot);
      console.log("Transaction signature:", signature);
      console.groupEnd();

      // Parse the event data
      const parsedEvent = parseEventData(
        event,
        program.idl.events.find((e) => e.name === eventName)
      );
      console.log("New Event Detected:", {
        name: eventName,
        signature: signature,
        data: parsedEvent,
      });

      // Save the event log
      await saveEscrowEventLog({
        chainId: chain.dbChainId,
        programId: program.programId.toBase58(),
        eventName: eventName,
        signature: signature,
        parsedEvent: parsedEvent,
        slot: slot,
      });
    } catch (error) {
      console.error(
        `Error handling event ${eventName} on chain ${chain.id}:`,
        error.stack || error
      );
    }
  };

  // Listen for Escrow Contract events
  const listenForEvents = async () => {
    for (const chain of CHAINS) {
      try {
        const program = MUTUAL_ESCROW_PROGRAM(chain.id);
        const eventNames = program.idl.events.map((e) => e.name);

        // console.group(`Listening for events on chain ${chain.id}`);
        // console.log('Detected event names:', eventNames);
        console.groupEnd();

        eventNames.forEach((eventName) => {
          program.addEventListener(
            eventName,
            async (event, slot, signature) => {
              await handleEvent({
                chain,
                program,
                eventName,
                event,
                slot,
                signature,
              });
            }
          );
        });
      } catch (error) {
        console.error(
          `Error listening for escrow events on chain ${chain.id}:`,
          error.stack || error
        );
      }
    }
  };

  // TODO: Scans for MC Threshold reached or not. For the devnet, just make it reached after 1 minute

  // TODO: Scans for Token price updates. For the devnet, just make everything $1 for the price

  // TODO: Handle offer expiry, if the order createdAt more than expiry time threshold, auto reject it, and refund the tokens
  const handleCheckExpiredOffer = async () => {
    try {
      const nowUnix = manyMinutesFromNowUnix(0);
      const expiredOffers = await prismaClient.campaignOrder.findMany({
        where: {
          expiredAtUnix: {
            lt: nowUnix,
          },
          status: "CREATED",
        },
        orderBy: {
          expiredAtUnix: "asc",
        },
      });

      for (const offer of expiredOffers) {
        // console.log('Expired Offer:', offer);
        await handleExpiredOffer(offer.id);
      }

      console.log("Expired Offers:", expiredOffers.length);
    } catch (error) {
      console.error("Error checking expired offers:", error.stack || error);
    }
  };

  // Check every 1 minute
  cron.schedule(`*/1 * * * *`, async () => {
    console.log("Checking for expired offers...");
    // await handleCheckExpiredOffer();
  });
  // handleCheckExpiredOffer();

  // Post Impression & age
  const checkCampaignPost = async () => {
    // Make it query post instead
    const posts = await prismaClient.campaignPost.findMany({
      select: {
        id: true,
        campaignOrderId: true,
      },
      where: {
        // Last updated 15 minutes ago
        updatedAt: {
          lt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes
        },
        order: {
          status: {
            in: ["CREATED", "ACCEPTED", "COMPLETED"],
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log("Posts to check:", posts.length);
    const campaignOrderIds = posts.map((p) => p.campaignOrderId);

    console.log("Campaigns to check:", campaignOrderIds.length);
    for (const campaign of campaignOrderIds) {
      await handleCheckCampaignPost(campaign);
    }
  };

  // Every 1 min
  cron.schedule(`*/1 * * * *`, async () => {
    console.log("Checking for campaign posts...");
    // await checkCampaignPost();
  });

  // Graceful Shutdown: Ensure proper cleanup on exit
  const handleExit = () => {
    console.log("\nGracefully shutting down the event listeners...");
    process.exit(0);
  };

  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
  listenForEvents();

  done();
};
