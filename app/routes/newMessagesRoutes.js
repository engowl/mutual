import dayjs from "dayjs";
import { Server } from "socket.io";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { prismaClient } from "../db/prisma.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const newMessagesRoutes = (app, _, done) => {
  const { redis } = app;

  const io = new Server(app.server, {
    cors: {
      origin: "*",
    },
  });

  // util functions

  const createMessageKey = (userId1, userId2) => {
    return `message:${[userId1, userId2].sort().join(":")}:${Date.now()}`;
  };

  const retriveMessageKey = (userId1, userId2) => {
    return `message:${[userId1, userId2].sort().join(":")}`;
  };

  const activeUsers = new Map();

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    socket.on("register", async (userId) => {
      console.log("User joined", userId);
      activeUsers.set(userId, socket.id);
      await updateUserStatus(userId, "ONLINE");
      socket.emit("userStatusChange", {});
    });

    socket.on("direct-message", (msg) => {
      const { senderId, receiverId, text } = msg;
      console.log("Message received", msg, { activeUsers });
      const messageData = {
        senderId,
        receiverId,
        text,
        timestamp: new Date().toISOString(),
      };

      const messagekey = createMessageKey(senderId, receiverId);
      redis.hmset(messagekey, messageData, (err) => {
        if (err) {
          console.error("Error saving message to Redis:", err);
        } else {
          const receiverSocketId = activeUsers.get(receiverId);
          if (receiverSocketId) {
            const messageSend = {
              ...messageData,
              role: "other",
            };
            io.to(receiverSocketId).emit("direct-message", messageSend);
          }
          const senderSocketId = activeUsers.get(senderId);
          if (senderSocketId) {
            const messageSend = {
              ...messageData,
              role: "you",
            };
            io.to(senderSocketId).emit("direct-message", messageSend);
          }
          updateConversation(senderId, receiverId, text);
        }
      });
    });

    socket.on("disconnect", async () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          console.log("User disconnected:", socket.id);
          activeUsers.delete(userId);
          socket.emit("userStatusChange", {});
          await updateUserStatus(userId, "OFFLINE");
          break;
        }
      }
    });
  });

  // Database Functions
  async function updateConversation(senderId, receiverId, lastMessage) {
    console.log("Updating conversation", senderId, receiverId, lastMessage);
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

  async function updateUserStatus(userId, status) {
    try {
      const existingUser = await prismaClient.userMessaging.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!existingUser) {
        await prismaClient.userMessaging.create({
          data: {
            userId: userId,
            status,
          },
        });
        return;
      }

      await prismaClient.userMessaging.update({
        where: {
          userId: userId,
        },
        data: { status },
      });
      console.log(`User ${userId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  // REST-API

  // retrieve all messaging history between two users
  app.get("/history/:userId1/:userId2", async (req, reply) => {
    const { userId1, userId2 } = req.params;
    const { timezone } = req.query;
    const pattern = `${retriveMessageKey(userId1, userId2)}:*`;

    try {
      const keys = await redis.keys(pattern);
      const messages = await Promise.all(
        keys.map(async (key) => {
          const message = await redis.hgetall(key);
          message.role = message.senderId === userId1 ? "you" : "other";
          return message;
        })
      );

      // Sort messages by timestamp
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Group messages by day relative to user's timezone
      const groupedMessages = messages.reduce((acc, message) => {
        const day = dayjs(message.timestamp).tz(timezone).format("YYYY-MM-DD");
        let existingDay = acc[acc.length - 1];
        if (existingDay && existingDay[0] === day) {
          existingDay[1].push(message);
        } else {
          acc.push([day, [message]]);
        }
        return acc;
      }, []);

      return reply.send(groupedMessages);
    } catch (err) {
      console.error("Error fetching message history:", err);
      return reply
        .status(500)
        .send({ error: "Error fetching message history" });
    }
  });

  // retrive user detail to display in chat
  app.get("/user-details/:userId", async (req, reply) => {
    const { userId } = req.params;

    if (!userId) {
      return reply.status(400).send({ error: "Invalid userId" });
    }
    try {
      const user = await prismaClient.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          messaging: true,
        },
      });
      return reply.send(user);
    } catch (err) {
      console.error("Error fetching user details:", err);
      return reply.status(500).send({ error: "Error fetching user details" });
    }
  });

  // retrieve all conversations for a user
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

  done();
};
