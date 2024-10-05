/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const tokenRoutes = (app, _, done) => {
  app.get("/info", async (req, reply) => {
    const { tokenAddress } = req.query;

    if (!tokenAddress) {
      return reply.code(400).send({
        message: "tokenAddress is required",
      });
    }

    // TODO fetch token info from API

    return reply.send({
      mintAddress: "5mbK36SZ7J19An8jFochhQS4of8g6BwUjbeCSxBSoWdp",
      chainId: "MAINNET_BETA",
      name: "MICHI",
      symbol: "MICHI",
      decimals: 9,
      imageUrl: "https://picsum.photos/200",
      website: "https://michi.com",
      totalSupply: 1234567,
      marketCap: 123456789,
      priceUsd: 0.123,
      priceNative: 0.123,
      liquidityUsd: 12345,
      liquidityNative: 12345,
    });
  });
  done();
};
