import type { FastifyInstance } from 'fastify';

import { toErrorResponse } from '../../utils/http.js';
import { feedQuerySchema } from './feed.schemas.js';
import type { FeedService } from './feed.service.js';

export async function registerFeedRoutes(
  app: FastifyInstance,
  feedService: FeedService,
): Promise<void> {
  app.get('/api/feed/following', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = feedQuerySchema.parse(request.query);
      const result = await feedService.getFollowingFeed(request.user.userId, query);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/feed/hot', async (request, reply) => {
    try {
      const query = feedQuerySchema.parse(request.query);
      const result = await feedService.getHotFeed(query);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/feed/recommended', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const query = feedQuerySchema.parse(request.query);
      const result = await feedService.getRecommendedFeed(request.user.userId, query);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });
}
