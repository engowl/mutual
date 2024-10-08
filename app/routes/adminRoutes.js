import { prismaClient } from "../db/prisma.js";
import { fetchTokenData } from "../workers/helpers/tokenHelpers.js";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

export const adminRoutes = (app, _, done) => {
  app.get("/overview", async (req, reply) => {
    try {
      const now = new Date();
      const startOfCurrentMonth = startOfMonth(now);
      const endOfCurrentMonth = endOfMonth(now);
      const startOfPreviousMonth = startOfMonth(subMonths(now, 1));
      const endOfPreviousMonth = endOfMonth(subMonths(now, 1));

      // Run all queries within a transaction
      const [
        totalInfluencers,
        influencersCurrentMonth,
        influencersPreviousMonth,
        totalProjects,
        projectsCurrentMonth,
        projectsPreviousMonth,
        activeCampaigns,
        pastCampaigns,
        activeCampaignsCurrentMonth,
        activeCampaignsPreviousMonth,
        pastCampaignsCurrentMonth,
        pastCampaignsPreviousMonth,
      ] = await prismaClient.$transaction([
        // Total influencers count (with twitterAccount)
        prismaClient.influencer.count({
          where: {
            twitterAccount: {
              isNot: null,
            },
          },
        }),

        // Influencers created in current month (with twitterAccount)
        prismaClient.influencer.count({
          where: {
            AND: [
              {
                createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
              },
              {
                twitterAccount: {
                  isNot: null,
                },
              },
            ],
          },
        }),

        // Influencers created in previous month (with twitterAccount)
        prismaClient.influencer.count({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startOfPreviousMonth,
                  lte: endOfPreviousMonth,
                },
              },
              {
                twitterAccount: {
                  isNot: null,
                },
              },
            ],
          },
        }),

        // Total project owners count (with status APPROVED)
        prismaClient.projectOwner.count({
          where: {
            status: "APPROVED",
          },
        }),

        // Project owners created in current month (with status APPROVED)
        prismaClient.projectOwner.count({
          where: {
            AND: [
              {
                createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
              },
              { status: "APPROVED" },
            ],
          },
        }),

        // Project owners created in previous month (with status APPROVED)
        prismaClient.projectOwner.count({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startOfPreviousMonth,
                  lte: endOfPreviousMonth,
                },
              },
              { status: "APPROVED" },
            ],
          },
        }),

        // Active campaigns
        prismaClient.campaignOrder.count({
          where: {
            status: {
              in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"],
            },
          },
        }),

        // Past campaigns
        prismaClient.campaignOrder.count({
          where: {
            status: {
              in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
            },
          },
        }),

        // Active campaigns created in current month
        prismaClient.campaignOrder.count({
          where: {
            AND: [
              {
                createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
              },
              { status: { in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"] } },
            ],
          },
        }),

        // Active campaigns created in previous month
        prismaClient.campaignOrder.count({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startOfPreviousMonth,
                  lte: endOfPreviousMonth,
                },
              },
              { status: { in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"] } },
            ],
          },
        }),

        // Past campaigns created in current month
        prismaClient.campaignOrder.count({
          where: {
            AND: [
              {
                createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
              },
              {
                status: {
                  in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
                },
              },
            ],
          },
        }),

        // Past campaigns created in previous month
        prismaClient.campaignOrder.count({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startOfPreviousMonth,
                  lte: endOfPreviousMonth,
                },
              },
              {
                status: {
                  in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
                },
              },
            ],
          },
        }),
      ]);

      // Helper function to calculate percentage change
      const calculatePercentageChange = (current, previous) => {
        if (previous === 0) {
          return current > 0 ? 100 : 0; // Avoid division by zero
        }
        return ((current - previous) / previous) * 100;
      };

      // Calculate percentage changes
      const influencersPercentageChange = calculatePercentageChange(
        influencersCurrentMonth,
        influencersPreviousMonth
      );
      const projectsPercentageChange = calculatePercentageChange(
        projectsCurrentMonth,
        projectsPreviousMonth
      );
      const activeCampaignsPercentageChange = calculatePercentageChange(
        activeCampaignsCurrentMonth,
        activeCampaignsPreviousMonth
      );
      const pastCampaignsPercentageChange = calculatePercentageChange(
        pastCampaignsCurrentMonth,
        pastCampaignsPreviousMonth
      );

      // Structure the response
      const overviewData = {
        influencers: {
          count: totalInfluencers,
          percentageChange: influencersPercentageChange.toFixed(2),
        },
        projects: {
          count: totalProjects,
          percentageChange: projectsPercentageChange.toFixed(2),
        },
        campaigns: {
          active: {
            count: activeCampaigns,
            percentageChange: activeCampaignsPercentageChange.toFixed(2),
          },
          past: {
            count: pastCampaigns,
            percentageChange: pastCampaignsPercentageChange.toFixed(2),
          },
        },
      };

      // Send the response
      return reply.send({
        message: "Projects fetched successfully",
        data: {
          overview: overviewData,
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error fetching overview",
        error: error.message,
        data: null,
      });
    }
  });

  app.get("/projects", async (req, reply) => {
    try {
      const { status, chainId } = req.query;

      if (!status || !["PENDING", "APPROVED", "DECLINED"].includes(status)) {
        return reply.status(400).send({
          message: "Invalid or missing status query parameter",
          data: null,
        });
      }

      // Fetch project owners filtered by status
      const projectOwners = await prismaClient.projectOwner.findMany({
        where: {
          status: status,
        },
        include: {
          user: true,
          projectDetails: true,
        },
      });

      // Fetch token info for each projectDetail's contractAddress
      const projectsWithTokenInfo = await Promise.all(
        projectOwners.map(async (owner) => {
          const updatedProjectDetails = await Promise.all(
            owner.projectDetails.map(async (projectDetail) => {
              const tokenInfo = await fetchTokenData({
                mintAddress: projectDetail.contractAddress,
                chainId: chainId,
              });
              return {
                ...projectDetail,
                tokenInfo,
              };
            })
          );

          // Count active and past campaigns using filtering
          const activeCampaigns = await prismaClient.campaignOrder.count({
            where: {
              projectOwnerId: owner.id,
              status: {
                in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"],
              },
            },
          });

          const pastCampaigns = await prismaClient.campaignOrder.count({
            where: {
              projectOwnerId: owner.id,
              status: {
                in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
              },
            },
          });

          return {
            ...owner,
            projectDetails: updatedProjectDetails,
            activeCampaigns,
            pastCampaigns,
          };
        })
      );

      return reply.send({
        message: "Projects fetched successfully",
        data: {
          projectOwners: projectsWithTokenInfo, // Return the updated data
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error fetching projects",
        error: error.message,
        data: null,
      });
    }
  });

  app.post("/projects/:id/confirm", async (req, reply) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedOwner = await prismaClient.projectOwner.update({
        where: {
          id,
        },
        data: {
          status: status,
        },
      });

      return reply.send({
        message: `Success`,
        data: {
          projectOwner: updatedOwner,
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error during project update process",
        error: error.message,
        data: null,
      });
    }
  });

  // KOL
  app.get("/influencers", async (req, reply) => {
    try {
      const [influencersCount, influencers] = await prismaClient.$transaction([
        // Count the total number of influencers
        prismaClient.influencer.count({
          where: {
            twitterAccount: {
              isNot: null,
            },
          },
        }),

        // Fetch the detailed data for influencers
        prismaClient.influencer.findMany({
          where: {
            twitterAccount: {
              isNot: null,
            },
          },
          include: {
            orders: true,
            twitterAccount: true,
          },
        }),
      ]);

      const influencersWithCampaignCounts = await Promise.all(
        influencers.map(async (influencer) => {
          const activeCampaigns = await prismaClient.campaignOrder.count({
            where: {
              influencerId: influencer.id,
              status: {
                in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"],
              },
            },
          });

          // Count past campaigns
          const pastCampaigns = await prismaClient.campaignOrder.count({
            where: {
              influencerId: influencer.id,
              status: {
                in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
              },
            },
          });

          return {
            ...influencer,
            activeCampaigns,
            pastCampaigns,
          };
        })
      );

      return reply.send({
        message: `Success`,
        data: {
          influencersCount,
          influencers: influencersWithCampaignCounts,
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error during influencer retrieval process",
        error: error.message,
        data: null,
      });
    }
  });

  app.get("/influencers/:id", async (req, reply) => {
    try {
      const { id } = req.params;

      const influencer = await prismaClient.influencer.findUnique({
        where: { id },
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
          orders: true,
        },
      });

      if (!influencer) {
        return reply.status(404).send({
          message: "Influencer not found",
          data: null,
        });
      }

      // Count active and past campaigns for the influencer
      const activeCampaigns = await prismaClient.campaignOrder.count({
        where: {
          influencerId: id,
          status: {
            in: ["CREATED", "ACCEPTED", "PARTIALCOMPLETED"],
          },
        },
      });

      const pastCampaigns = await prismaClient.campaignOrder.count({
        where: {
          influencerId: id,
          status: {
            in: ["COMPLETED", "REJECTED", "DISPUTED", "RESOLVED"],
          },
        },
      });

      return reply.send({
        message: `Success`,
        data: {
          influencer: {
            ...influencer,
            activeCampaigns,
            pastCampaigns,
          },
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error retrieving influencer details",
        error: error.message,
        data: null,
      });
    }
  });

  app.delete("/influencers/:id", async (req, reply) => {
    try {
      const { id } = req.params;

      // Check if the influencer exists
      const influencer = await prismaClient.influencer.findUnique({
        where: { id },
      });

      if (!influencer) {
        return reply.status(404).send({
          message: "Influencer not found",
          data: null,
        });
      }

      // Delete the influencer
      await prismaClient.influencer.delete({
        where: { id },
      });

      return reply.send({
        message: "Influencer successfully deleted",
        data: null,
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error deleting influencer",
        error: error.message,
        data: null,
      });
    }
  });

  done();
};
