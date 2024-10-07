import { Connection } from "@solana/web3.js";
import { CHAINS } from "../../config.js";
import { prismaClient } from "../db/prisma.js";
import { getTokenInfo } from "../utils/solanaUtils.js";
import { dexscreenerGetTokens } from "../lib/api/dexscreener.js";
import { fetchPairData, fetchTokenData } from "../workers/helpers/tokenHelpers.js";

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const tokenRoutes = (app, _, done) => {
  app.get("/info", async (req, reply) => {
    try {
      const { tokenAddress, chainId = 'devnet' } = req.query;

      if (!tokenAddress) {
        return reply.code(400).send({
          message: "tokenAddress is required",
        });
      }

      const chain = CHAINS.find(c => c.id === chainId);
      if (!chain) {
        return reply.code(400).send({
          message: "Invalid chain ID",
        });
      }

      const tokenData = await fetchTokenData({
        mintAddress: tokenAddress,
        chainId: chain.id
      })

      const pairData = await fetchPairData({
        tokenId: tokenData.id,
      })

      const data = {
        mintAddress: tokenData.mintAddress,
        chainId: tokenData.chainId,
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        imageUrl: tokenData.imageUrl,
        totalSupply: tokenData.totalSupply,
        holderCount: tokenData.holderCount,
        pair: pairData,
      }

      return reply.send(data);
    } catch (error) {
      console.error(`Error fetching token info: ${error.message}`);
      return reply.code(500).send({
        message: "Internal server error",
      });
    }
  });
  done();
};
