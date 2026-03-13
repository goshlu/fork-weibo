import fp from 'fastify-plugin';

import { toErrorResponse } from '../utils/http.js';

export const errorPlugin = fp(async (app) => {
  app.setErrorHandler((error, request, reply) => {
    const mapped = toErrorResponse(error);

    request.log.error(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        error,
      },
      'request failed',
    );

    if (!reply.sent) {
      reply.code(mapped.statusCode).send({
        message: mapped.message,
        requestId: request.id,
      });
    }
  });
});
