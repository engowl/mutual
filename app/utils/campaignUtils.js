import { Connection } from "@solana/web3.js";
import { CHAINS, VESTING_CONFIG } from "../../config.js";
import { getTokenInfo } from "./solanaUtils.js";
import { prismaClient } from "../db/prisma.js";
import { validateRequiredFields } from "./validationUtils.js";
import { getCreateDealTxDetails } from "../lib/contract/mutualEscrowContract.js";

// getCreateDealTxDetails('5A1ohsSEw8JwYnh3trUEbTUAu5Dkf4a26fZdAbrFEL6JLzKJomFuZurNGyYohmWLWDES8fxbDqCAZWNYbZ4jDCzk', 'devnet');

export const validateVestingCondition = (vestingType, vestingCondition) => {
  const vestingOption = VESTING_CONFIG.find(option => option.id === vestingType);

  // If vestingType is invalid
  if (!vestingOption) {
    return {
      isValid: false,
      message: `Invalid vesting type: ${vestingType}. Allowed types are: ${VESTING_CONFIG.map(option => option.id).join(', ')}.`,
    };
  }

  // For TIME-based vesting, check if vestingCondition has a valid vestingDuration
  if (vestingType === 'TIME') {
    if (vestingCondition && vestingCondition.vestingDuration && vestingOption.conditions.includes(vestingCondition.vestingDuration)) {
      return { isValid: true, message: 'Valid vesting condition' };
    } else {
      return {
        isValid: false,
        message: `Invalid vestingCondition format for TIME. Expected format: { vestingDuration: '1-month' }. Allowed durations are: ${vestingOption.conditions.join(', ')}.`,
      };
    }
  }

  // For MARKETCAP-based vesting, check if vestingCondition has a valid marketcapThreshold
  if (vestingType === 'MARKETCAP') {
    const threshold = vestingCondition?.marketcapThreshold;
    const isPredefined = vestingOption.conditions.includes(Number(threshold));
    const isCustom = vestingOption.allowCustom && Number(threshold) > 0;

    if (threshold && (isPredefined || isCustom)) {
      return { isValid: true, message: isPredefined ? 'Valid predefined market cap threshold' : 'Valid custom market cap threshold' };
    } else {
      return {
        isValid: false,
        message: `Invalid vestingCondition format for MARKETCAP. Expected format: { marketcapThreshold: 1000000 }. Predefined thresholds are: ${vestingOption.conditions.join(', ')}, or provide a positive custom value.`,
      };
    }
  }

  // For NONE vesting, the vestingCondition should be an empty object
  if (vestingType === 'NONE') {
    if (!vestingCondition || Object.keys(vestingCondition).length === 0) {
      return { isValid: true, message: 'No vesting condition required for NONE type' };
    } else {
      return {
        isValid: false,
        message: 'Invalid vestingCondition format for NONE. Expected an empty object: {}.',
      };
    }
  }

  // Default error case
  return { isValid: false, message: 'Invalid vesting condition' };
};

export async function validateOfferData(req, reply, checkTxHash = false) {
  try {
    const { orderId, vestingType, vestingCondition, influencerId, chainId = "MAINNET_BETA", mintAddress, createDealTxHash } = req.body;

    // Validate required fields
    const requiredFields = [
      'orderId', 'influencerId', 'vestingType', 'vestingCondition',
      'chainId', 'mintAddress', 'tokenAmount', 'campaignChannel',
      'promotionalPostText', 'postDateAndTime'
    ];
    if (checkTxHash) requiredFields.push('createDealTxHash');

    await validateRequiredFields(req.body, requiredFields, reply);

    // Validate vestingType and vestingCondition
    const validVestingType = VESTING_CONFIG.find(option => option.id === vestingType);
    if (!validVestingType) return reply.status(400).send({ message: 'Invalid vesting type' });

    const isConditionValid = validateVestingCondition(vestingType, vestingCondition);
    if (!isConditionValid.isValid) return reply.status(400).send({ message: isConditionValid.message });

    // Validate orderId is 16 characters long alphanumeric
    if (orderId.length !== 16 || !orderId.match(/^[0-9a-zA-Z]+$/)) {
      return reply.status(400).send({ message: 'Order ID must be 16 characters long alphanumeric' });
    }

    const existingOrder = await prismaClient.campaignOrder.findUnique({
      where: {
        id: orderId
      }
    })
    if (existingOrder) {
      return reply.status(400).send({ message: 'Order ID already exists' });
    }

    // Validate influencerId
    const influencer = await prismaClient.influencer.findUnique({ where: { id: influencerId }, select: { id: true } });
    if (!influencer) return reply.status(400).send({ message: 'There is no influencer with the provided ID' });

    // Validate if mintAddress is valid and token exists in the database (within the last hour)
    const chain = CHAINS.find(c => c.id === chainId);
    if (!chain) return reply.status(400).send({ message: 'Invalid chain ID' });

    let existingToken = await prismaClient.token.findUnique({
      where: {
        mintAddress_chainId: { mintAddress, chainId: chain.dbChainId },
        updatedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 1) } // 1 hour
      }
    });

    if (!existingToken) {
      const connection = new Connection(chain.rpcUrl, 'confirmed');
      const token = await getTokenInfo(mintAddress, connection).catch((e) => {
        return reply.status(400).send({ message: `Invalid token address: ${e.message}` });
      });

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

    console.log('Token validated:', existingToken);

    // Validate createDealTxHash if required
    if (checkTxHash && !createDealTxHash) {
      return reply.status(400).send({ message: 'Transaction hash is required' });
    }

    return { success: true };

  } catch (error) {
    console.error('Validation error:', error);
    reply.status(500).send({ message: error?.message || 'Internal server error' });
    return { success: false };
  }
}
