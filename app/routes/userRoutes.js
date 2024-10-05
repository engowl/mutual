import {
  authorizeTwitter,
  getTwitterUser,
  unTwitterApiGetUser,
} from "../api/twitterApi.js";
import { prismaClient } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { formatGetUserResponse } from "../utils/unOfficialTwitterApiUtils.js";
/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const userRoutes = (app, _, done) => {
  app.get(
    "/users",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      try {
        const users = [];
        return reply.status(200).send(users);
      } catch (error) {
        return reply.status(500).send({ message: "Error fetching users" });
      }
    }
  );

  app.get(
    "/me",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      const user = req.user;

      try {
        const userData = await prismaClient.user.findFirst({
          where: {
            wallet: {
              address: user.address,
            },
          },
          include: {
            wallet: true,
            projectOwner: {
              include: {
                projectDetails: {
                  include: {
                    twitterAccount: true,
                  },
                },
              },
            },
            influencer: {
              include: {
                projectCriterias: true,
                packages: true,
                twitterAccount: true,
              },
            },
          },
        });

        console.log({ userData });
        return reply.send({
          message: "User found",
          error: null,
          data: {
            user: userData,
          },
        });
      } catch (error) {
        console.log({ error });
        return reply.status(500).send({
          message: "Error fetching user",
          error: error.message,
          data: null,
        });
      }
    }
  );

  app.post(
    "/update",
    {
      preHandler: [authMiddleware],
    },
    async (req, reply) => {
      const user = req.user;
      const { role, influencer, projectOwner } = req.body;

      try {
        const updateData = {};

        const currentUser = await prismaClient.user.findFirst({
          where: {
            wallet: {
              address: user.address,
            },
          },
        });

        if (role) {
          if (!["PROJECT_OWNER", "INFLUENCER"].includes(role)) {
            return reply.status(400).send({ message: "Invalid role" });
          }
          updateData.role = role;

          if (role === "INFLUENCER") {
            const existingInfluencer = await prismaClient.influencer.findUnique(
              {
                where: {
                  userId: currentUser.id,
                },
              }
            );

            if (!existingInfluencer) {
              updateData.influencer = {
                create: {},
              };
            }
          } else if (role === "PROJECT_OWNER") {
            const existingProjectOwner =
              await prismaClient.projectOwner.findUnique({
                where: {
                  userId: currentUser.id,
                },
              });

            if (!existingProjectOwner) {
              updateData.projectOwner = {
                create: {},
              };
            }
          }
        }

        if (influencer) {
          const { userTwitter, telegramLink, projectCriteria, packages } =
            influencer;

          let unUserTwitter;

          if (userTwitter) {
            const unUserData = await unTwitterApiGetUser({
              userId: userTwitter.id,
            });

            const formattedData = formatGetUserResponse(unUserData);

            unUserTwitter = formattedData;
          }

          updateData.influencer = {
            update: {
              telegramLink,
              projectCriterias: {
                create: projectCriteria,
              },
              ...(packages
                ? {
                    packages: {
                      deleteMany: {},
                      create: packages.map((pkg) => ({
                        description: pkg.description,
                        type: pkg.type,
                        price: pkg.price,
                      })),
                    },
                  }
                : {}),
              ...(userTwitter
                ? {
                    twitterAccount: {
                      upsert: {
                        update: {
                          name: userTwitter.name,
                          username: userTwitter.username,
                          followersCount: unUserTwitter.followers_count,
                          description: unUserTwitter.description,
                        },
                        create: {
                          accountId: userTwitter.id,
                          name: userTwitter.name,
                          username: userTwitter.username,
                          followersCount: unUserTwitter.followers_count,
                          description: unUserTwitter.description,
                        },
                      },
                    },
                  }
                : {}),
            },
          };
        }

        if (projectOwner) {
          const { telegramAdmin, projectDetail } = projectOwner;
          const { userTwitter } = projectDetail;

          updateData.projectOwner = {
            update: {
              telegramAdmin: telegramAdmin || "",
              status: "PENDING",
              projectDetails: {
                create: {
                  projectName: projectDetail.projectName,
                  contractAddress: projectDetail.contractAddress,
                  telegramGroupLink: projectDetail.telegramGroupLink,
                  twitterAccount: {
                    create: {
                      accountId: userTwitter.id,
                      name: userTwitter.name,
                      username: userTwitter.username,
                    },
                  },
                },
              },
            },
          };
        }

        const updatedUser = await prismaClient.user.update({
          where: {
            id: currentUser.id,
          },
          data: updateData,
        });

        return reply.send({
          message: "Successfuly update user",
          error: null,
          data: {
            user: updatedUser,
          },
        });
      } catch (error) {
        console.log({ error });
        return reply.status(500).send({
          message: "Error update user",
          error: error.message,
          data: null,
        });
      }
    }
  );

  app.get(
    "/twitter/authorize",
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      try {
        const url = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${process.env.TWITTER_CLIENT_ID}&redirect_uri=${process.env.FRONTEND_URL}&scope=tweet.read%20users.read%20follows.read%20follows.write&state=state&code_challenge=challenge&code_challenge_method=plain`;
        return reply.send({
          message: "Success",
          error: null,
          data: {
            redirectUrl: url,
          },
        });
      } catch (error) {
        return reply.status(500).send({ message: "Error authorize" });
      }
    }
  );

  app.post(
    "/twitter/connect",
    { preHandler: [authMiddleware] },
    async (req, reply) => {
      const { code } = req.body;

      try {
        const authorizeResponse = await authorizeTwitter({
          code: code,
          redirectUri: process.env.FRONTEND_URL,
          codeVerifier: "challenge",
        });

        const userTwitter = await getTwitterUser({
          accessToken: authorizeResponse.access_token,
        });

        return reply.send({
          message: "Success",
          error: null,
          data: {
            userTwitter: userTwitter.data,
          },
        });
      } catch (error) {
        console.log({ error });
        return reply.status(500).send({
          message: "Error connect twitter",
          error: error.message,
          data: null,
        });
      }
    }
  );

  done();
};
