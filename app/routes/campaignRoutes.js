import { authMiddleware } from "../middleware/authMiddleware.js"

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const campaignRoutes = (app, _, done) => {

  // Create an offer to the KOL
  app.post('/create-offer', {
    preHandler: [authMiddleware]
  }, async (req, reply) => {
    try {
      return reply.status(200).send("OK")
    } catch (error) {
      return reply.status(500).send({ message: 'Error creating offer' })
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