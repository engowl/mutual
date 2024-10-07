

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {*} done
 */
export const escrowRoutes = (app, _, done) => {
  app.get('/stats', async (req, reply) => {
    try {
      // Main Data Points:
      // - Number of KOLs
      // - Number of Projects
      // - Current Active Campaigns
      // - Number of Completed Campaigns
      // - Escrow Balance (charts)
      // - Campaign Completion Rate
      // - Top Influencers by Revenue
      // - Top Campaigns by Impressions
      // - Revenue (charts) 
      // - Revenue Breakdown (tweet / telegram)
      // - Top Campaigns by Impressions

      return reply.send("Escrow stats fetched successfully");
    } catch (error) {
      console.error('Error fetching escrow stats:', error.stack || error)
      return reply.status(500).send({
        message: 'Error fetching escrow stats',
        error: error,
        data: null
      })
    }
  })

  done()
}