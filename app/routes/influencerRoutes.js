import { prismaClient } from "../db/prisma.js";

export const influencerRoutes = (app, _, done) => {
  app.get("/all", async (request, reply) => {
    try {
      let influencers = await prismaClient.influencer.findMany({
        where: {
          packages: {
            some: {},
          },
        },
        include: {
          user: true,
          twitterAccount: true,
          packages: true,
        },
      });

      influencers = influencers.map((influencer) => {
        const sortedPackages = influencer.packages.sort(
          (a, b) => a.price - b.price
        );
        return {
          ...influencer,
          packages:
            sortedPackages.length > 0
              ? {
                  id: sortedPackages[0].id,
                  name: sortedPackages[0].name,
                  price: sortedPackages[0].price,
                  description: sortedPackages[0].description,
                }
              : null, // In case there are no packages
        };
      });

      return reply.status(200).send({
        message: "Influencers fetched successfully",
        error: null,
        data: influencers,
      });
    } catch (e) {
      console.error(e);
      return reply.status(500).send({
        message: "Error while fetching influencers",
        error: e,
        data: null,
      });
    }
  });

  done();
};
