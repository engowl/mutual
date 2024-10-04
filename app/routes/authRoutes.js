import nacl from "tweetnacl";
import base58 from "bs58";
import jwt from "jsonwebtoken";
import { verifySignIn } from "@solana/wallet-standard-util";
import { PublicKey } from "@solana/web3.js";
import { prismaClient } from "../db/prisma.js";
import axios from "axios";
import { UserWalletType } from "@prisma/client";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const authRoutes = (app, _, done) => {
  app.get("/client/create", async (request, reply) => {
    try {
      const newClient = await axios
        .post(
          "https://api.portalhq.io/api/v1/custodians/clients",
          {
            isAccountAbstracted: false,
          },
          {
            headers: {
              Authorization: `Bearer 0b2f1f0a-886d-4d6a-a015-91393ff1e1c5`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => res.data);

      return reply.send({
        message: "Client Created",
        error: null,
        data: {
          client: newClient,
        },
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error while creating a new client",
        error: error.message,
        data: null,
      });
    }
  });

  app.post("/sign-in/check", async (request, reply) => {
    const { email } = request.body;

    try {
      const user = await prismaClient.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        return reply.send({
          message: "User found",
          error: null,
          data: {
            isExist: true,
            user: user,
          },
        });
      } else {
        return reply.send({
          message: "User not found",
          error: null,
          data: {
            isExist: false,
          },
        });
      }
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error while signing in with google",
        error: error.message,
        data: null,
      });
    }
  });

  app.post("/register", async (request, reply) => {
    const { name, email, address, portalClientApiKey, portalClientId, wallet } =
      request.body;

    try {
      let user = await prismaClient.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prismaClient.user.create({
          data: {
            email,
            name,
            portalClientApiKey,
            portalClientId,
            wallet: {
              create: {
                address: wallet.address,
                type: UserWalletType.MPC,
                amount: wallet.amount || 0,
              },
            },
          },
        });
      }

      const token = jwt.sign(
        {
          address: address,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "4d",
        }
      );

      const dataToReturn = {
        session_token: token,
      };

      return reply.send({
        message: "Signed in successfully",
        error: null,
        data: dataToReturn,
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error while signing in",
        error: error.message,
        data: null,
      });
    }
  });

  app.post("/sign-in/google", async (request, reply) => {
    const { email } = request.body;

    try {
      const user = await prismaClient.user.findUnique({
        where: { email: email },
        include: {
          wallet: true,
        },
      });

      const token = jwt.sign(
        {
          address: user.wallet.address,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "4d",
        }
      );

      const dataToReturn = {
        session_token: token,
        user: user,
      };

      return reply.send({
        message: "Signed in successfully",
        error: null,
        data: dataToReturn,
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error while signing in",
        error: error.message,
        data: null,
      });
    }
  });

  app.post("/sign-in", async (request, reply) => {
    const { siwsData, type } = request.body;

    if (!siwsData || !type) {
      return reply.status(400).send({
        message: "SIWS data and type must be provided",
      });
    }

    try {
      const parsedSIWS = JSON.parse(siwsData);

      console.log({ parsedSIWS });

      if (type === "siws") {
        const input = parsedSIWS.input;
        const publicKey = new PublicKey(parsedSIWS.publicKey);
        console.log({ publicKey });
        const output = {
          account: {
            address: parsedSIWS.publicKey,
            publicKey: publicKey.toBytes(),
          },
          signature: new Uint8Array(parsedSIWS.output.signature.data),
          signedMessage: new Uint8Array(parsedSIWS.output.signedMessage.data),
        };

        const verify = verifySignIn(input, output);

        if (!verify) {
          return reply.status(400).send({
            message: "Failed to verify sign in",
            error: null,
            data: null,
          });
        }
      } else {
        const data = {
          encodedMessage: base58.decode(parsedSIWS.encodedMessage),
          signature: base58.decode(parsedSIWS.signature),
          publicKey: base58.decode(parsedSIWS.publicKey),
        };

        const isVerified = await nacl.sign.detached.verify(
          data.encodedMessage,
          data.signature,
          data.publicKey
        );

        if (!isVerified) {
          return reply.status(400).send({
            message: "Failed to verify sign in",
            error: null,
            data: null,
          });
        }
      }

      const token = jwt.sign(
        {
          address: parsedSIWS.publicKey,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "4d",
        }
      );

      let user = await prismaClient.user.findFirst({
        where: {
          wallet: {
            address: parsedSIWS.publicKey,
          },
        },
        include: {
          wallet: true,
        },
      });

      if (!user) {
        user = await prismaClient.user.create({
          data: {
            wallet: {
              create: {
                address: parsedSIWS.publicKey,
                type: UserWalletType.EOA,
                amount: 0,
              },
            },
          },
          include: {
            wallet: true,
          },
        });
      }

      const dataToReturn = {
        session_token: token,
        user: user,
      };

      return reply.send({
        message: "Signed in successfully",
        error: null,
        data: dataToReturn,
      });
    } catch (error) {
      console.log({ error });
      return reply.status(500).send({
        message: "Error while signing in",
        error: error.message,
        data: null,
      });
    }
  });

  done();
};
