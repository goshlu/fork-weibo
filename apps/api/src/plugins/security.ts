import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../config/env.js';
import { MemoryRateLimiter, type RateLimiter } from '../lib/rate-limiter.js';
interface SecurityPluginOptions {
  rateLimiter?: RateLimiter;
}

function toRateLimitKey(request: FastifyRequest): string {
  const ip = request.ip || 'unknown';
  const routeKey = request.url.split('?')[0];
  return `${ip}:${routeKey}`;
}

function sendRateLimitExceeded(reply: FastifyReply, retryAfterSeconds: number): FastifyReply {
  reply.header('Retry-After', retryAfterSeconds);
  reply.code(429).send({
    message: 'Too many requests, please try again later',
  });
  return reply;
}

export const securityPlugin = fp<SecurityPluginOptions>(async (app, options) => {
  const primaryRateLimiter = options.rateLimiter ?? new MemoryRateLimiter();
  const fallbackRateLimiter = new MemoryRateLimiter();

  app.addHook('onRequest', async (request, reply) => {
    const key = toRateLimitKey(request);

    try {
      const result = await primaryRateLimiter.consume(
        key,
        env.RATE_LIMIT_MAX,
        env.RATE_LIMIT_WINDOW_MS,
      );
      if (!result.allowed) {
        return sendRateLimitExceeded(reply, result.retryAfterSeconds);
      }
    } catch (error) {
      request.log.warn(
        { error, key },
        'primary rate limiter failed, fallback to memory limiter',
      );

      const fallbackResult = await fallbackRateLimiter.consume(
        key,
        env.RATE_LIMIT_MAX,
        env.RATE_LIMIT_WINDOW_MS,
      );
      if (!fallbackResult.allowed) {
        return sendRateLimitExceeded(reply, fallbackResult.retryAfterSeconds);
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
