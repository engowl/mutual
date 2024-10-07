import { Connection, PublicKey } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import { CHAINS } from "../../../config.js";
import { prismaClient } from "../../db/prisma.js";
import { getTokenInfo } from "../../utils/solanaUtils.js";
import { dexscreenerGetTokens } from "../../lib/api/dexscreener.js";

export const fetchTokenData = async ({
  mintAddress,
  chainId
}) => {
  const chain = CHAINS.find(c => c.id === chainId);
  if (!chain) {
    throw new Error("Invalid chain ID");
  }

  let existingToken = await prismaClient.token.findUnique({
    where: {
      mintAddress_chainId: {
        mintAddress: mintAddress,
        chainId: chain.dbChainId
      },
      updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 1) }, // 1 hour
    },
  });



  if (!existingToken) {
    const connection = new Connection(chain.rpcUrl, 'confirmed');
    const token = await getTokenInfo(mintAddress, connection).catch((e) => {
      console.error(`Error fetching token info: ${e.message}`);
      throw e;
    });

    fetchTokenHolderCount({
      tokenId: existingToken.id
    })

    existingToken = await prismaClient.token.upsert({
      where: {
        mintAddress_chainId: {
          mintAddress: mintAddress,
          chainId: chain.dbChainId
        }
      },
      create: {
        mintAddress: mintAddress,
        chainId: chain.dbChainId,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        imageUrl: token.image,
        description: token.description,
        uriData: token.uriData
      },
      update: {
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        totalSupply: token.totalSupply,
        imageUrl: token.image,
        description: token.description,
        uriData: token.uriData
      }
    });
  }

  return existingToken;
}

export const fetchPairData = async ({
  tokenId
}) => {
  const token = await prismaClient.token.findUnique({
    where: {
      id: tokenId
    }
  });

  if (!token) {
    throw new Error("Token not found");
  }

  let existingPair = await prismaClient.pair.findUnique({
    where: {
      tokenId: tokenId,
      updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 1) }, // 1 minute
    },
  });

  if (!existingPair) {
    let pair;

    if (token.chainId === 'MAINNET_BETA') {
      const dexsData = await dexscreenerGetTokens({
        tokenAddresses: [token.mintAddress]
      })
      console.log('Dexscreener data:', dexsData);

      pair = dexsData.pairs?.[0];
    } else {
      // Use dummy data for devnet
      pair = {
        pairAddress: 'dummyPairAddress',
        url: 'https://dummyurl.com',
        priceNative: '0.001',
        priceUsd: '0.1',
        fdv: '100000',
        marketCap: '100000',
        liquidity: {
          usd: '250000'
        },
        info: {}
      }
    }

    console.log('Pair:', pair);

    existingPair = await prismaClient.pair.upsert({
      where: {
        tokenId: tokenId
      },
      create: {
        address: pair.pairAddress,
        url: pair.url,
        priceNative: parseFloat(pair.priceNative),
        priceUsd: parseFloat(pair.priceUsd),
        fdv: parseFloat(pair.fdv),
        marketCap: parseFloat(pair.marketCap),
        liquidityUsd: parseFloat(pair.liquidity.usd),
        info: pair.info,
        token: {
          connect: {
            id: tokenId
          }
        }
      },
      update: {
        address: pair.pairAddress,
        url: pair.url,
        priceNative: parseFloat(pair.priceNative),
        priceUsd: parseFloat(pair.priceUsd),
        fdv: parseFloat(pair.fdv),
        marketCap: parseFloat(pair.marketCap),
        liquidityUsd: parseFloat(pair.liquidity.usd),
        info: pair.info,
      }
    })
  }

  return existingPair;
}

export const fetchTokenHolderCount = async ({
  tokenId
}) => {
  try {
    const token = await prismaClient.token.findUnique({
      where: {
        id: tokenId
      }
    });

    if (!token) {
      throw new Error("Token not found");
    }

    const chain = CHAINS.find(c => c.dbChainId === token.chainId);

    const connection = new Connection(chain.rpcUrl, 'confirmed');

    console.log('Fetching token holder count for:', token.mintAddress);
    const accounts = await connection.getProgramAccounts(
      splToken.TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165 // Size of a token account
          },
          {
            memcmp: {
              offset: 0, // The offset where the mint address is stored in the token account
              bytes: token.mintAddress
            }
          }
        ],
        commitment: 'confirmed',
        encoding: 'base64' // Avoid fetching full account data, only necessary metadata
      }
    );

    await prismaClient.token.update({
      where: {
        id: tokenId
      },
      data: {
        holderCount: accounts.length
      }
    });

    return accounts.length;
  } catch (error) {
    console.error(`Error fetching token holder count: ${error.message}`);
  }
}

fetchTokenHolderCount({
  tokenId: 'cm1y7e4ub0000kckskbdrthnx'
})