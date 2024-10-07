import Moralis from "moralis";
import { CHAINS } from "../../config.js";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { prismaClient } from "../db/prisma.js";
import { getTokenInfo } from "../utils/solanaUtils.js";
import { sleep } from "../utils/miscUtils.js";

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

  app.get("/portfolio", async (req, reply) => {
    try {
      const { walletAddress, chainId = 'devnet' } = req.query;

      if (!walletAddress || !chainId) {
        return reply.code(400).send({
          message: "walletAddress and chainId is required",
        });
      }

      const chain = CHAINS.find(c => c.id === 'devnet');

      if (!chain) {
        return reply.code(400).send({
          message: "Invalid chain ID",
        });
      }

      const connection = new Connection(chain.rpcUrl, "confirmed");
      const publicKey = new PublicKey(walletAddress);

      // Fetch all token accounts by owner
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID
        }
      );

      const fetchMintData = async (mintAddress) => {
        let existingCache = await prismaClient.mintDataCache.findUnique({
          where: {
            mintAddress_chainId: {
              mintAddress: mintAddress,
              chainId: chain.dbChainId,
            }
          },
        });

        if (existingCache) {
          return existingCache;
        }

        const connection = new Connection(chain.rpcUrl, "confirmed");
        console.log("mintAddress: ", mintAddress);
        const tokenInfo = await getTokenInfo(
          mintAddress,
          connection
        )
        if (!tokenInfo) {
          console.log("Token info not found for mint: ", mintAddress);
          existingCache = await prismaClient.mintDataCache.create({
            data: {
              mintAddress: mintAddress,
              chainId: chain.dbChainId,
              name: 'invalid',
              symbol: 'invalid',
              decimals: 0,
              imageUrl: null,
              description: 'invalid',
              uriData: {},
              isInvalid: true
            }
          })

          return existingCache;
        }

        console.log("Token info fetched successfully: ", tokenInfo);

        existingCache = await prismaClient.mintDataCache.create({
          data: {
            mintAddress: mintAddress,
            chainId: chain.dbChainId,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            imageUrl: tokenInfo.image,
            description: tokenInfo.description,
            uriData: tokenInfo.uriData,
          }
        })

        return existingCache;
      };

      // Create an empty array to store the portfolio data
      const portfolioData = [];

      for (let i = 0; i < tokenAccounts.value.length; i++) {
        const accountInfo = tokenAccounts.value[i];
        const accountData = accountInfo.account.data.parsed.info;

        const mint = accountData.mint;

        // Fetch mint data asynchronously
        const mintData = await fetchMintData(mint);
        if (mintData.isInvalid) {
          console.log("Mint data not found for mint: ", mint);
          continue;
        }

        // Push the processed data into the portfolioData array
        portfolioData.push({
          mint: accountData.mint,
          owner: accountData.owner,
          tokenAmount: accountData.tokenAmount.uiAmount,
          token: {
            name: mintData.name,
            symbol: mintData.symbol,
            decimals: mintData.decimals,
            imageUrl: mintData.imageUrl,
            description: mintData.description,
          }
        });
      }

      console.log("Portfolio info fetched successfully: ", portfolioData);

      // Get Native SOL balance
      const balance = await connection.getBalance(publicKey)
      const nativeBalance = {
        name: "SOL",
        symbol: "SOL",
        decimals: 9,
        imageUrl: 'https://assets.coingecko.com/coins/images/4128/standard/solana.png?1718769756',
        amount: balance / LAMPORTS_PER_SOL,
      }

      return reply.code(200).send({
        message: "Portfolio info fetched successfully",
        nativeBalance: nativeBalance,
        splBalance: portfolioData,
      });

    } catch (error) {
      console.log("Error getting portfolio info: ", error?.details?.response?.data)
      return reply.code(500).send({
        message: error.message,
        data: null,
      });
    }
  })
};
