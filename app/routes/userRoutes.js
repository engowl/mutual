import { authMiddleware } from "../middleware/authMiddleware";

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
};
