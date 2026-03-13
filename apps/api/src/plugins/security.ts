import fp from 'fastify-plugin';

import { env } from '../config/env.js';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const bucket = new Map<string, RateLimitEntry>();

export const securityPlugin = fp(async (app) => {
  app.addHook('onRequest', async (request, reply) => {
    const ip = request.ip || 'unknown';
    const routeKey = request.url.split('?')[0];
    const key = `${ip}:${routeKey}`;
    const now = Date.now();
    const current = bucket.get(key);

    if (!current || now > current.resetAt) {
      bucket.set(key, {
        count: 1,
        resetAt: now + env.RATE_LIMIT_WINDOW_MS,
      });
    } else {
      current.count += 1;
      if (current.count > env.RATE_LIMIT_MAX) {
        reply.header('Retry-After', Math.ceil((current.resetAt - now) / 1000));
        reply.code(429).send({
          message: 'Too many requests, please try again later',
        });
        return reply;
      }
    }
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Request-Id', request.id);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('Cross-Origin-Resource-Policy', 'same-site');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self';",
    );
    return payload;
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request completed',
    );
  });
});
