import nacl from "tweetnacl";
import base58 from "bs58";
import jwt from "jsonwebtoken";
import { verifySignIn } from "@solana/wallet-standard-util";
import { PublicKey } from "@solana/web3.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const authRoutes = (app, _, done) => {
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

  done();
};
