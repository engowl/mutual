import { ProjectOwnerStatus } from "@prisma/client";
import { prismaClient } from "../db/prisma.js";

export const adminRoutes = (app, _, done) => {
  app.get("/projects", async (req, reply) => {
    try {
      const { status } = req.query;

      if (!status || !["PENDING", "APPROVED"].includes(status)) {
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

      return reply.send({
        message: "Projects fetched successfully",
        data: {
          projectOwners: projectOwners,
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

  app.post("/projects/:id/approve", async (req, reply) => {
    try {
      const { id } = req.params;

      const updatedOwner = await prismaClient.projectOwner.update({
        where: {
          id,
        },
        data: {
          status: ProjectOwnerStatus.APPROVED,
        },
      });

      return reply.send({
        message: "Project approved",
        data: {
          projectOwner: updatedOwner,
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error during project approval process",
        error: error.message,
        data: null,
      });
    }
  });

  done();
};
