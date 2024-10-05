import { Server } from "socket.io";
import moment from "moment";
import { prismaClient } from "../db/prisma.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const messagesRoutes = (app, _, done) => {
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

      console.log(activeUsers);
      console.log(`User ${userId} joined`);
    });

    socket.on("userActive", async ({ userId }) => {
      activeUsers.set(userId, socket.id);
      // await updateUserStatus(userId, "online");
      console.log(`User ${userId} is now active`);
    });

    socket.on("userInactive", async ({ userId }) => {
      activeUsers.delete(userId);
      // await updateUserStatus(userId, "offline");
      console.log(`User ${userId} is now inactive`);
    });

    socket.on(
      "personal-message",
      async ({ senderId, receiverId, content, role }) => {
        const receiverSocketId = activeUsers.get(receiverId);
        console.log({ senderId });
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("personal-message", {
            senderId,
            content,
          });
        }
      }
    );

    socket.on("disconnect", async () => {
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          // await updateUserStatus(userId, "offline");
          break;
        }
      }
    });
  });

  async function updateUserStatus(userId, status) {
    try {
      const user = await prismaClient.userMessage.update({
        where: { userId: userId },
        data: { status },
      });
      io.emit("userStatusChange", { userId, status });
      console.log(`User ${userId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  // REST API routes
  app.get("/:userId", async (request, reply) => {
    const { userId } = request.params;
    const { timezone } = request.query;

    try {
      const messages = await prismaClient.message.findMany({
        where: {
          OR: [
            { senderId: parseInt(userId) },
            { receiverId: parseInt(userId) },
          ],
        },
        include: {
          sender: true,
          receiver: true,
        },
        orderBy: {
          sentAt: "asc",
        },
      });

      const groupedMessages = messages.reduce((acc, message) => {
        const day = moment(message.sentAt).tz(timezone).format("YYYY-MM-DD");
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push({
          ...message,
          localTime: moment(message.sentAt).tz(timezone).format("HH:mm"),
        });
        return acc;
      }, {});

      reply.send(groupedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      reply.status(500).send({ error: "Failed to fetch messages" });
    }
  });

  app.post("/", async (request, reply) => {
    const { content, senderId, receiverId, senderTimezone } = request.body;
    try {
      const message = await prismaClient.message.create({
        data: {
          content,
          senderId,
          receiverId,
          sentAt: new Date(),
          senderTimezone,
        },
        include: {
          sender: true,
          receiver: true,
        },
      });

      reply.send(message);
    } catch (error) {
      console.error("Error sending message:", error);
      reply.status(500).send({ error: "Failed to send message" });
    }
  });

  app.get("/conversations/:userId", async (request, reply) => {
    const { userId } = request.params;

    try {
      // Find the latest message in each conversation involving the user
      const conversations = await prismaClient.$queryRaw`
        SELECT m.*, u1.id AS senderId, u1.name AS senderName, u2.id AS receiverId, u2.name AS receiverName
        FROM "Message" m
        JOIN "User" u1 ON m."senderId" = u1.id
        JOIN "User" u2 ON m."receiverId" = u2.id
        WHERE m."id" IN (
          SELECT MAX(m2."id")
          FROM "Message" m2
          WHERE m2."senderId" = ${userId} OR m2."receiverId" = ${userId}
          GROUP BY LEAST(m2."senderId", m2."receiverId"), GREATEST(m2."senderId", m2."receiverId")
        )
        ORDER BY m."sentAt" DESC
      `;

      const sidebarPreview = conversations.map((message) => {
        const isUserSender = message.senderId === userId;
        const otherUser = isUserSender
          ? { id: message.receiverId, name: message.receiverName }
          : { id: message.senderId, name: message.senderName };

        return {
          user: otherUser,
          lastMessage: {
            content: message.content,
            sentAt: message.sentAt,
          },
        };
      });

      reply.send(sidebarPreview);
    } catch (error) {
      console.error("Error fetching conversation previews:", error);
      reply.status(500).send({ error: "Failed to fetch conversations" });
    }
  });

  done();
};
