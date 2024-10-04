import { prismaClient } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
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
                projectDetails: true,
              },
            },
            influencer: {
              include: {
                projectCriteria: true,
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

        if (role) {
          if (!["PROJECT_OWNER", "INFLUENCER"].includes(role)) {
            return reply.status(400).send({ message: "Invalid role" });
          }
          updateData.role = role;
        }

        if (influencer) {
          updateData.influencer = {
            update: influencer,
          };
        }

        if (projectOwner) {
          const { telegramAdmin, projectDetail } = projectOwner;

          updateData.projectOwner = {
            create: {
              telegramAdmin: telegramAdmin || "",
              status: "PENDING",
              projectDetails: {
                create: projectDetail,
              },
            },
          };
        }

        const currentUser = await prismaClient.user.findFirst({
          where: {
            wallet: {
              address: user.address,
            },
          },
        });

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

  done();
};
