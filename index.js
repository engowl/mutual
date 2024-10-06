import "./dotenv.js";

import Fastify from "fastify";
import FastifyCors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import fastifyMultipart from "@fastify/multipart";
import { authRoutes } from "./app/routes/authRoutes.js";
import { userRoutes } from "./app/routes/userRoutes.js";
import { campaignRoutes } from "./app/routes/campaignRoutes.js";
import { tokenRoutes } from "./app/routes/tokenRoutes.js";
import { messagesRoutes } from "./app/routes/messagesRoutes.js";
import { campaignWorkers } from "./app/workers/campaignWorkers.js";
import { influencerRoutes } from "./app/routes/influencerRoutes.js";
import { adminRoutes } from "./app/routes/adminRoutes.js";
import { twitterWorkers } from "./app/workers/twitterWorkers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: false,
});

fastify.register(FastifyCors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB in bytes
  },
});

fastify.get("/", async (request, reply) => {
  return reply.status(200).send({
    message: "Hi, I'm MUTUAL API!",
    error: null,
    data: null,
  });
});

/* --------------------------------- Routes --------------------------------- */

fastify.register(authRoutes, { prefix: "/auth" });
fastify.register(userRoutes, { prefix: "/users" });
fastify.register(campaignRoutes, { prefix: "/campaign" });
fastify.register(tokenRoutes, { prefix: "/token" });
fastify.register(messagesRoutes, {
  prefix: "/messages",
});
fastify.register(influencerRoutes, {
  prefix: "/influencer",
});
fastify.register(adminRoutes, { prefix: "/__admin" });

/* --------------------------------- Workers -------------------------------- */
fastify.register(campaignWorkers);
fastify.register(twitterWorkers);

const start = async () => {
  try {
    const port = process.env.APP_PORT || 3500;
    await fastify.listen({
      port: port,
      host: "0.0.0.0",
    });

    console.log(
      `Server started successfully on localhost:${port} at ${new Date()}`
    );
  } catch (error) {
    console.log("Error starting server: ", error);
    process.exit(1);
  }
};

start();
