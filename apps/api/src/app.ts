import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';

import { env } from './config/env.js';
import { MemoryCache } from './lib/cache.js';
import { DiscoveryRepository } from './modules/discovery/discovery.repository.js';
import { registerDiscoveryRoutes } from './modules/discovery/discovery.routes.js';
import { DiscoveryService } from './modules/discovery/discovery.service.js';
import { registerFeedRoutes } from './modules/feed/feed.routes.js';
import { FeedService } from './modules/feed/feed.service.js';
import { InteractionRepository } from './modules/interactions/interaction.repository.js';
import { registerInteractionRoutes } from './modules/interactions/interaction.routes.js';
import { InteractionService } from './modules/interactions/interaction.service.js';
import { PostRepository } from './modules/posts/post.repository.js';
import { registerPostRoutes } from './modules/posts/post.routes.js';
import { PostService } from './modules/posts/post.service.js';
import { UserRepository } from './modules/users/user.repository.js';
import { registerUserRoutes } from './modules/users/user.routes.js';
import { UserService } from './modules/users/user.service.js';
import { authPlugin } from './plugins/auth.js';
import { errorPlugin } from './plugins/errors.js';
import { securityPlugin } from './plugins/security.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: env.TRUST_PROXY === 'true',
  });

  const uploadRoot = path.join(process.cwd(), env.UPLOAD_DIR);
  const dataRoot = path.join(process.cwd(), env.DATA_DIR);

  await mkdir(uploadRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });

  await app.register(cors, {
    origin: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 9,
    },
  });

  await app.register(securityPlugin);
  await app.register(authPlugin);
  await app.register(errorPlugin);

  await app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });

  const cache = new MemoryCache();
  const userRepository = new UserRepository(path.join(dataRoot, 'users.json'));
  const postRepository = new PostRepository(path.join(dataRoot, 'posts.json'));
  const interactionRepository = new InteractionRepository(path.join(dataRoot, 'interactions.json'));
  const discoveryRepository = new DiscoveryRepository(path.join(dataRoot, 'search-trends.json'));

  const userService = new UserService(userRepository);
  const postService = new PostService(postRepository, cache);
  const interactionService = new InteractionService(
    interactionRepository,
    userRepository,
    postRepository,
    cache,
  );
  const feedService = new FeedService(postRepository, interactionRepository, cache);
  const discoveryService = new DiscoveryService(postRepository, discoveryRepository, cache);

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    cache: 'memory',
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
    },
  }));

  await registerUserRoutes(app, userService);
  await registerPostRoutes(app, postService);
  await registerInteractionRoutes(app, interactionService);
  await registerFeedRoutes(app, feedService);
  await registerDiscoveryRoutes(app, discoveryService);

  return app;
}
