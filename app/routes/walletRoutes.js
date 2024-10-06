import Moralis from "moralis";

export const walletRoutes = async (app) => {
  await Moralis.start({
    apiKey: process.env.MORALIS_API_KEY,
  });

  app.get("/info", async (req, reply) => {
    const { walletAddress, network } = req.query;

    if (!walletAddress || !network) {
      return reply.code(400).send({
        message: "walletAddress and network is required",
      });
    }

    try {
      let response = await Moralis.SolApi.account.getSPL({
        network: network,
        address: walletAddress,
      });

      console.log("Wallet info fetched successfully: ", response.raw);

      return reply.code(200).send({
        message: "Wallet info fetched successfully",
        data: response.raw,
      });
    } catch (error) {
      console.log("Error getting wallet info: ", error);
      return reply.code(500).send({
        message: error.message,
        data: null,
      });
    }
  });
};
