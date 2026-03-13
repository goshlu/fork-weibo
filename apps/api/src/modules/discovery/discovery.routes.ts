import type { FastifyInstance } from 'fastify';

import { toErrorResponse } from '../../utils/http.js';
import { pageQuerySchema, searchQuerySchema } from './discovery.schemas.js';
import type { DiscoveryService } from './discovery.service.js';

export async function registerDiscoveryRoutes(
  app: FastifyInstance,
  discoveryService: DiscoveryService,
): Promise<void> {
  app.get('/api/search', async (request, reply) => {
    try {
      const query = searchQuerySchema.parse(request.query);
      const result = await discoveryService.searchPosts(query);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/discover/topics', async (request, reply) => {
    try {
      const query = pageQuerySchema.parse(request.query);
      const items = await discoveryService.getTrendingTopics(query.pageSize);
      return { items, page: query.page, pageSize: query.pageSize, total: items.length };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/discover/searches', async (request, reply) => {
    try {
      const query = pageQuerySchema.parse(request.query);
      const items = await discoveryService.getTrendingSearches(query.pageSize);
      return { items, page: query.page, pageSize: query.pageSize, total: items.length };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/discover/channels', async (_request, reply) => {
    try {
      const items = await discoveryService.getChannels();
      return { items, total: items.length };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });
}
