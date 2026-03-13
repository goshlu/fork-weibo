import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';

import { env } from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      username: string;
    };
    user: {
      userId: string;
      username: string;
    };
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate(
    'authenticate',
    async function authenticate(request: import('fastify').FastifyRequest) {
      await request.jwtVerify();
    },
  );

  app.decorate(
    'authenticateOptional',
    async function authenticateOptional(request: import('fastify').FastifyRequest) {
      if (!request.headers.authorization) {
        return;
      }

      await request.jwtVerify();
    },
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest) => Promise<void>;
    authenticateOptional: (request: import('fastify').FastifyRequest) => Promise<void>;
  }
}
