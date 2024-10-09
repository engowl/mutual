import { prismaClient } from "../db/prisma.js";
import cron from "node-cron"; import { fetchTokenHolderCount } from "./helpers/tokenHelpers.js";
import { sleep } from "../utils/miscUtils.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {Function} done
 */
export const tokenWorkers = (app, _, done) => {

  const handleUpdateTokenHolders = async (delayBetweenCalls = 15000) => { // Default delay is 15 seconds
    const tokens = await prismaClient.token.findMany({
      where: {
        updatedAt: {
          // last updated 15 minutes ago
          lt: new Date(Date.now() - 1000 * 60 * 15)
        }
      },
      orderBy: {
        updatedAt: 'asc'
      }
    });

    console.log(`Found ${tokens.length} tokens to update holders`);

    // Process each token holder update with a delay between each call
    await Promise.all(tokens.map(async (token, index) => {
      console.log(`Updating holders for token: ${token.name}`);
      await sleep(index * delayBetweenCalls); // Delay between each request
      await fetchTokenHolderCount({
        tokenId: token.id
      });
    }));

    console.log("All token holder updates processed.");
  };


  // Every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running token holders update...");
    // handleUpdateTokenHolders();
  });

  handleUpdateTokenHolders();

  done();
}