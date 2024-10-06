import { prismaClient } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

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
          packages: {
            orderBy: {
              type: "asc",
            },
          },
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

  app.get("/:id", async (request, reply) => {
    const influencerId = request.params.id;

    try {
      const influencer = await prismaClient.influencer.findUnique({
        where: {
          id: influencerId,
        },
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
          twitterAccount: true,
          packages: {
            orderBy: {
              type: "asc",
            },
          },
        },
      });

      return reply.status(200).send({
        message: "Influencer fetched successfully",
        error: null,
        data: influencer,
      });
    } catch (e) {
      console.error(e);
      return reply.status(500).send({
        message: "Error while fetching influencer",
        error: e,
        data: null,
      });
    }
  });

  app.post(
    "/package/:id/update",
    {
      preHandler: [authMiddleware],
    },
    async (request, reply) => {
      const id = request.params.id;
      const { price, description } = request.body;

      try {
        const updatedPackage = await prismaClient.package.update({
          where: {
            id: id,
          },
          data: {
            price: price,
            description: description,
          },
        });

        return reply.status(200).send({
          message: "Package updated successfully",
          error: null,
          data: updatedPackage,
        });
      } catch (e) {
        console.error(e);
        return reply.status(500).send({
          message: "Error while update package",
          error: e,
          data: null,
        });
      }
    }
  );

  done();
};
