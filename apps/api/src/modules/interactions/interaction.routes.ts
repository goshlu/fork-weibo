import type { FastifyInstance } from 'fastify';

import { toErrorResponse } from '../../utils/http.js';
import { commentSchema, favoriteSchema } from './interaction.schemas.js';
import type { InteractionService } from './interaction.service.js';

export async function registerInteractionRoutes(
  app: FastifyInstance,
  interactionService: InteractionService,
): Promise<void> {
  app.post('/api/posts/:id/likes', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const result = await interactionService.likePost(request.user.userId, params.id);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.delete('/api/posts/:id/likes', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const result = await interactionService.unlikePost(request.user.userId, params.id);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.post(
    '/api/posts/:id/favorites',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const params = request.params as { id: string };
        const payload = favoriteSchema.parse(request.body);
        const result = await interactionService.favoritePost(
          request.user.userId,
          params.id,
          payload.folderName,
        );
        return result;
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );

  app.delete(
    '/api/posts/:id/favorites/:folderName',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const params = request.params as { id: string; folderName: string };
        const result = await interactionService.unfavoritePost(
          request.user.userId,
          params.id,
          params.folderName,
        );
        return result;
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );

  app.get('/api/favorites', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const result = await interactionService.listFavorites(request.user.userId);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.post(
    '/api/posts/:id/comments',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const params = request.params as { id: string };
        const payload = commentSchema.parse(request.body);
        const comment = await interactionService.addComment(
          request.user.userId,
          params.id,
          payload.content,
          payload.parentId,
        );
        return reply.code(201).send({ comment });
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );

  app.get('/api/posts/:id/comments', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const comments = await interactionService.listComments(params.id);
      return { comments };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/comments/:id', async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const comment = await interactionService.getCommentById(params.id);
      if (!comment) {
        return reply.code(404).send({ message: 'Comment not found' });
      }
      return { comment };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });
  app.post('/api/users/:id/follow', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const result = await interactionService.followUser(request.user.userId, params.id);
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.delete(
    '/api/users/:id/follow',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const params = request.params as { id: string };
        const result = await interactionService.unfollowUser(request.user.userId, params.id);
        return result;
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );

  app.get('/api/notifications', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const notifications = await interactionService.listNotifications(request.user.userId);
      return { notifications };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.post(
    '/api/notifications/read',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const result = await interactionService.markNotificationsRead(request.user.userId);
        return result;
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );

  app.post(
    '/api/notifications/:id/read',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const params = request.params as { id: string };
        const result = await interactionService.markNotificationRead(request.user.userId, params.id);
        return result;
      } catch (error) {
        const mapped = toErrorResponse(error);
        return reply.code(mapped.statusCode).send({ message: mapped.message });
      }
    },
  );
}

