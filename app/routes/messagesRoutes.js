import { Server } from "socket.io";
import { prismaClient } from "../db/prisma.js";
import cron from "node-cron";
import { authMiddleware } from "../middleware/authMiddleware.js";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(tz);
dayjs.extend(utc);
/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const messagesRoutes = (app, _, done) => {
  const { redis } = app;

  const io = new Server(app.server, {
    cors: {
      origin: "*",
    },
  });

  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("join", async ({ userId }) => {
      activeUsers.set(userId, socket.id);
      await updateUserStatus(userId, "ONLINE");
      socket.emit("userStatusChange", {});
      console.log(`User ${userId} joined`);
    });

    socket.on(
      "personal-message",
      async ({ senderId, receiverId, content, role }) => {
        const sortedId = [senderId, receiverId].sort().join("_");

        const messageData = {
          senderId,
          receiverId,
          content,
          sentAt: new Date().toISOString(),
          status: "pending",
        };

        const messageId = `${Date.now()}`;
        const messageKey = `message:conversation:${sortedId}:${messageId}`;

        await redis.hmset(messageKey, messageData);

        const receiverSocketId = activeUsers.get(receiverId);
        const senderSocketId = activeUsers.get(senderId);

        io.to(receiverSocketId).emit("personal-message", {
          senderId,
          receiverId,
          content,
          role,
        });

        if (senderSocketId) {
          io.to(senderSocketId).emit("personal-message", {
            senderId,
            receiverId,
            content,
            role,
          });
        }

        await updateConversation(senderId, receiverId, content);
      }
    );

    socket.on("disconnect", async () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          socket.emit("userStatusChange", {});
          await updateUserStatus(userId, "OFFLINE");
        }
      }
    });
  });

  async function updateUserStatus(userId, status) {
    try {
      const existingUser = await prismaClient.userMessage.findFirst({
        where: {
          userId: userId,
        }
      })

      if(!existingUser) {
        return ""
      }

      await prismaClient.userMessage.update({
        where: {
          userId: userId,
        },
        data: { status },
      });
      io.emit("userStatusChange", { userId, status });
      console.log(`User ${userId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  async function updateConversation(senderId, receiverId, lastMessage) {
    try {
      await prismaClient.userConversation.upsert({
        where: {
          userId_otherUserId: {
            userId: senderId,
            otherUserId: receiverId,
          },
        },
        update: {
          lastMessage,
          updatedAt: new Date(),
        },
        create: {
          userId: senderId,
          otherUserId: receiverId,
          lastMessage,
        },
      });

      // Update the reverse conversation as well
      await prismaClient.userConversation.upsert({
        where: {
          userId_otherUserId: {
            userId: receiverId,
            otherUserId: senderId,
          },
        },
        update: {
          lastMessage,
          updatedAt: new Date(),
        },
        create: {
          userId: receiverId,
          otherUserId: senderId,
          lastMessage,
        },
      });
    } catch (error) {
      console.error("Error updating conversation:", error);
    }
  }

  // REST API routes
  app.get(
    "/conversation/:userId/:otherUserId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { userId, otherUserId } = request.params;
      const { timezone } = request.query;

      console.log({ userId, otherUserId, timezone });

      try {
        const sortedUserIds = [userId, otherUserId].sort().join("_");

        const redisMessageKeys = await redis.keys(
          `message:conversation:${sortedUserIds}:*`
        );
        // console.log({ redisMessageKeys });

        let redisMessages = [];

        for (const key of redisMessageKeys) {
          const message = await redis.hgetall(key);
          // console.log({ message }, "from redis");
          redisMessages.push({
            ...message,
            sentAt: new Date(message.sentAt), // Convert timestamp to Date
          });
        }

        // console.log({ redisMessages });

        const allMessages = [...redisMessages];

        const finalMessages = allMessages.map((message) => ({
          ...message,
          role: message.senderId === userId ? "user" : "other",
        }));

        const sortedMessages = finalMessages.sort(
          (a, b) => new Date(a.sentAt) - new Date(b.sentAt)
        );

        const groupedMessages = sortedMessages.reduce((acc, message) => {
          const day = dayjs(message.sentAt).tz(timezone).format("YYYY-MM-DD");
          if (!acc[day]) {
            acc[day] = [];
          }
          acc[day].push({
            ...message,
            localTime: dayjs(message.sentAt).tz(timezone).format("HH:mm"),
          });
          return acc;
        }, {});

        console.log({ groupedMessages });

        return reply.send(groupedMessages);
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch conversation history" });
      }
    }
  );

  app.get(
    "/conversation-detail/:conversationId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { conversationId } = request.params;

      try {
        const conversation = await prismaClient.userConversation.findUnique({
          where: { id: conversationId },
          include: {
            otherUser: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!conversation) {
          return reply.status(404).send({ error: "Conversation not found" });
        }

        return reply.send({
          message: "Conversation details fetched successfully",
          data: {
            conversationId: conversation.id,
            userId: conversation.userId,
            otherUser: {
              id: conversation.otherUserId,
              name: conversation.otherUser.user.name,
            },
          },
        });
      } catch (error) {
        console.error("Error fetching conversation details:", error);
        return reply.status(500).send({
          data: null,
          message: "",
          error: "Failed to fetch conversation details",
        });
      }
    }
  );

  app.get(
    "/conversations/:userId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { userId } = request.params;

      try {
        const conversations = await prismaClient.userConversation.findMany({
          where: { userId },
          include: {
            otherUser: {
              include: {
                user: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        });

        const test = conversations[0];
        // console.log({ test });

        const conversationPreviews = conversations.map((conv) => ({
          id: conv.id,
          userId: conv.otherUserId,
          name: conv.otherUser.user.name,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
        }));

        return reply.send(conversationPreviews);
      } catch (error) {
        console.error("Error fetching conversation previews:", error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch conversations" });
      }
    }
  );

  app.get(
    "/other-user-details/:userId",
    { preHandler: [authMiddleware] },
    async (request, reply) => {
      const { userId } = request.params;
      try {
        const user = await prismaClient.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            messagesSent: true,
          },
        });

        if (!user) {
          return reply.status(404).send({ error: "User not found" });
        }

        return reply.send({
          message: "User details fetched successfully",
          data: user,
        });
      } catch (error) {
        console.error("Error fetching user details:", error);
        return reply
          .status(500)
          .send({ error: "Failed to fetch user details" });
      }
    }
  );

  cron.schedule("*/5 * * * *", async () => {
    try {
      const messageKeys = await redis.keys("message:*");

      // console.log({ messageKeys });

      for (const key of messageKeys) {
        const messageData = await redis.hgetall(key);
        if (
          !messageData.senderId ||
          !messageData.receiverId ||
          !messageData.content
        ) {
          console.error("Invalid message data:", messageData);
          continue;
        }

        // console.log({ messageData });

        await prismaClient.message.create({
          data: {
            content: messageData.content,
            sender: {
              connectOrCreate: {
                create: {
                  user: {
                    connect: { id: messageData.senderId },
                  },
                },
                where: { userId: messageData.senderId },
              },
            },
            receiver: {
              connectOrCreate: {
                create: {
                  user: {
                    connect: { id: messageData.receiverId },
                  },
                },
                where: { userId: messageData.receiverId },
              },
            },
            sentAt: new Date(messageData.sentAt),
            senderTimezone: "UTC",
          },
        });

        // await redis.del(key);
      }
      console.log("Synced messages to database");
    } catch (error) {
      console.error("Error syncing messages:", error);
    }
  });

  done();
};
