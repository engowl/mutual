import { formatGetUserResponse } from "../api/unTwitterApi/helpers.js";
import { unTwitterApiGetUser } from "../api/unTwitterApi/unTwitterApi.js";
import { prismaClient } from "../db/prisma.js";
import cron from "node-cron";
import { sleep } from "../utils/miscUtils.js";

export const twitterWorkers = (app, _, done) => {
  const getTwitterData = async (userId) => {
    try {
      const response = await unTwitterApiGetUser({
        userId: userId,
      });
      const userData = formatGetUserResponse(response);

      return userData;
    } catch (error) {
      console.log("ERROR_GET_TWITTER_DATA", error);
      return null;
    }
  };

  const updateTwitterAccounts = async () => {
    try {
      const twitterAccounts = await prismaClient.twitterAccount.findMany();

      const updatePromises = twitterAccounts.map(async (twitterAccount) => {
        const { accountId, username } = twitterAccount;
        const twitterData = await getTwitterData(accountId);

        console.log(twitterData);

        if (twitterData) {
          await prismaClient.twitterAccount.update({
            where: { id: twitterAccount.id },
            data: {
              followersCount: twitterData.followers_count,
              description: twitterData.description,
              profileImageUrl: twitterData.profile_image_url_https,
            },
          });
          console.log(`Updated Twitter data for ${username}`);
        } else {
          console.log(`Failed to update Twitter data for ${username}`);
        }

        await sleep(4000);
      });

      await Promise.all(updatePromises);

      console.log("Twitter account update completed.");
    } catch (error) {
      console.error("ERROR_UPDATE_TWITTER_DATA", error);
    }
  };

  // Schedule the job to run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running Twitter account update...");

    updateTwitterAccounts();
  });

  // updateTwitterAccounts();

  done();
};
