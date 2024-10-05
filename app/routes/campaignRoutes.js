import { getTokenMetadata, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { CHAINS, VESTING_CONFIG } from "../../config.js"
import { prismaClient } from "../db/prisma.js"
import { authMiddleware } from "../middleware/authMiddleware.js"
import { validateOfferData, validateVestingCondition } from "../utils/campaignUtils.js"
import { validateRequiredFields } from "../utils/validationUtils.js"
import { Connection, PublicKey } from "@solana/web3.js"
import { getTokenInfo } from '../utils/solanaUtils.js';
import { getCreateDealTxDetails } from "../lib/contract/mutualEscrowContract.js"
import { validateTokenAmount } from "../utils/contractUtils.js"

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const campaignRoutes = (app, _, done) => {
  // Validate the offer data before creating the offer, this is called before the user called the create_deal function on the contract
  // Endpoint for validation only
  app.post('/create-offer-check', { preHandler: [authMiddleware] }, async (req, reply) => {
    const validationResult = await validateOfferData(req, reply);
    if (validationResult.success) reply.status(200).send({ message: 'Validation successful' });
  });


  // Create an offer to the KOL
  app.post('/create-offer', {
    preHandler: [authMiddleware]
  }, async (req, reply) => {
    try {
      // This endpoint will be called AFTER the user has called the create_deal function on the contract and the transaction is confirmed.
      // orderId is generated by the frontend and is unique, it is used to identify the order to link between the backend and the contract
      const { user } = req;
      console.log('User:', user);

      const validationResult = await validateOfferData(req, reply, true);
      if (!validationResult.success) return;

      const { orderId, vestingType, vestingCondition, influencerId, chainId = "devnet", mintAddress, createDealTxHash, tokenAmount, campaignChannel = 'TWITTER' } = req.body;

      const chain = CHAINS.find(c => c.id === chainId);
      if (!chain) {
        return reply.status(400).send({ message: 'Invalid chain ID' });
      }
      console.log('Chain:', chain);

      console.log('Order Validated, proceed to confirm the deal on the contract');

      // TODO: Validate is the createDeal txHash is valid, 
      const dealAccountData = await getCreateDealTxDetails(createDealTxHash, chainId).catch((e) => {
        return reply.status(400).send({
          message: `Invalid create deal transaction. Please check if the transaction hash is correct and the transaction is confirmed. TxHash: ${createDealTxHash}`
        });
      });
      console.log('Deal Account Data:', dealAccountData);

      // Check if the orderId is the same as the one in the contract
      if (orderId !== dealAccountData.orderId) {
        return reply.status(400).send({ message: 'Order ID mismatch' });
      }

      // Check if mintAddress is the same as the one in the contract
      if (mintAddress.toLowerCase() !== dealAccountData.mint.toLowerCase()) {
        return reply.status(400).send({ message: 'Mint address mismatch' });
      }

      // Check if the vestingType is the same as the one in the contract
      if (vestingType.toLowerCase() !== dealAccountData.vestingType.toLowerCase()) {
        return reply.status(400).send({ message: 'Vesting type mismatch' });
      }

      const token = await prismaClient.token.findUnique({
        where: {
          mintAddress_chainId: {
            mintAddress: mintAddress,
            chainId: chain.dbChainId
          }
        }
      })
      if (!token) {
        return reply.status(400).send({ message: 'Token not found' });
      }

      // Check is the amount is the same as the one in the contract
      const clientAmount = tokenAmount;
      const contractAmount = dealAccountData.amount;
      const validateAmount = validateTokenAmount(clientAmount, contractAmount, token.decimals);

      if (!validateAmount.isValid) {
        return reply.status(400).send({ message: validateAmount.message });
      }

      // Insert the offer to the database
      const offer = await prismaClient.campaignOrder.create({
        data: {
          id: orderId,
          influencerId: influencerId,
          tokenId: token.id,
          tokenAmount: tokenAmount,
          channel: campaignChannel.toUpperCase(),
          vestingType: vestingType.toUpperCase(),
          vestingCondition: vestingCondition
        }
      })

      console.log('Offer created:', offer);

      return reply.status(200).send(offer);
    } catch (error) {
      console.error('Error creating offer:', error)
      return reply.status(500).send({ message: error?.message || 'Internal server error' })
    }
  })

  // KOL accepts the deal
  app.post('/accept-deal', { preHandler: [authMiddleware] }, async (request, reply) => {
    // KOL accepts the deal
    reply.send('OK');
  });

  // KOL rejects the deal
  app.post('/reject-deal', { preHandler: [authMiddleware] }, async (request, reply) => {
    // KOL rejects the deal (backend admin handles the contract interaction)
    reply.send('OK');
  });

  // KOL confirms that the obligated task is done
  app.post('/confirm-task', { preHandler: [authMiddleware] }, async (request, reply) => {
    // KOL confirms the task (tweet, post, etc.). On-demand verification is done here.
    reply.send('OK');
  });

  // Check if the task was fulfilled (backend admin verifies)
  app.post('/verify-task', { preHandler: [authMiddleware] }, async (request, reply) => {
    // Backend verifies if the task was fulfilled and calls partial eligibility on the contract
    reply.send('OK');
  });

  // KOL claims tokens (partially or fully)
  app.post('/claim-tokens', { preHandler: [authMiddleware] }, async (request, reply) => {
    // KOL claims tokens (either fully or partially based on conditions)
    reply.send('OK');
  });

  // Deal is marked as finished (after the final claim)
  app.post('/finish-deal', { preHandler: [authMiddleware] }, async (request, reply) => {
    // Mark the deal as finished when all conditions are met and tokens are claimed
    reply.send('OK');
  });


  done()
}