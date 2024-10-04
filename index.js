import "./dotenv.js";

import Fastify from "fastify";
import FastifyCors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import fastifyMultipart from "@fastify/multipart";
import { authRoutes } from "./app/routes/authRoutes.js";
import { userRoutes } from "./app/routes/userRoutes.js";
import { campaignRoutes } from './app/routes/campaignRoutes.js';
import { campaignWorkers } from "./app/workers/campaignWorkers.js";

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
fastify.register(campaignRoutes, { prefix: '/campaign' });

/* --------------------------------- Workers -------------------------------- */
fastify.register(campaignWorkers)

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
