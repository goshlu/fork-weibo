import type { Dirent } from 'node:fs';
import { access, copyFile, cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { createClient, type RedisClientType } from 'redis';

import { env } from './config/env.js';
import { MemoryCache, RedisCache, type CacheStore } from './lib/cache.js';
import {
  MemoryRateLimiter,
  RedisRateLimiter,
  type RateLimiter,
} from './lib/rate-limiter.js';
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
import {
  appRoot,
  resolveLegacyStorageDir,
  resolveStorageDir,
} from './utils/storage-paths.js';

const seedRoot = path.resolve(appRoot, 'seed');

async function bootstrapDataFromSeed(dataRoot: string): Promise<void> {
  let entries: Dirent[];

  try {
    entries = await readdir(seedRoot, { withFileTypes: true });
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) {
      continue;
    }

    const targetPath = path.join(dataRoot, entry.name);

    try {
      await access(targetPath);
      continue;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== 'ENOENT') {
        throw error;
      }
    }

    await copyFile(path.join(seedRoot, entry.name), targetPath);
  }
}

async function migrateLegacyUploads(uploadRoot: string): Promise<void> {
  const legacyUploadRoot = resolveLegacyStorageDir(env.UPLOAD_DIR);
  if (!legacyUploadRoot) {
    return;
  }

  if (path.resolve(legacyUploadRoot) === path.resolve(uploadRoot)) {
    return;
  }

  try {
    await access(legacyUploadRoot);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  await cp(legacyUploadRoot, uploadRoot, {
    recursive: true,
    force: false,
    errorOnExist: false,
  });
}

async function getLegacyUploadStatus(uploadRoot: string): Promise<{
  legacyUploadRoot?: string;
  entryCount: number;
}> {
  const legacyUploadRoot = resolveLegacyStorageDir(env.UPLOAD_DIR);
  if (!legacyUploadRoot) {
    return { legacyUploadRoot: undefined, entryCount: 0 };
  }

  if (path.resolve(legacyUploadRoot) === path.resolve(uploadRoot)) {
    return { legacyUploadRoot, entryCount: 0 };
  }

  try {
    await access(legacyUploadRoot);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === 'ENOENT') {
      return { legacyUploadRoot, entryCount: 0 };
    }
    throw error;
  }

  const entries = await readdir(legacyUploadRoot);
  const entryCount = entries.filter((entry) => entry !== '.gitkeep').length;
  return { legacyUploadRoot, entryCount };
}

export async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: env.TRUST_PROXY === 'true',
  });
  let cacheBackend = 'memory';
  let rateLimitBackend = 'memory';
  let cache: CacheStore = new MemoryCache();
  let rateLimiter: RateLimiter = new MemoryRateLimiter();
  let redisClient: RedisClientType | undefined;

  const uploadRoot = resolveStorageDir(env.UPLOAD_DIR);
  const dataRoot = resolveStorageDir(env.DATA_DIR);

  await mkdir(uploadRoot, { recursive: true });
  await mkdir(dataRoot, { recursive: true });
  await migrateLegacyUploads(uploadRoot);
  const legacyUploadStatus = await getLegacyUploadStatus(uploadRoot);
  await bootstrapDataFromSeed(dataRoot);

  if (legacyUploadStatus.legacyUploadRoot && legacyUploadStatus.entryCount > 0) {
    app.log.warn(
      {
        legacyUploadRoot: legacyUploadStatus.legacyUploadRoot,
        currentUploadRoot: uploadRoot,
        remainingEntries: legacyUploadStatus.entryCount,
      },
      'legacy upload directory still has files; run `pnpm cleanup:legacy-storage`',
    );
  }

  await app.register(cors, {
    origin: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 9,
    },
  });

  if (env.REDIS_URL) {
    redisClient = createClient({ url: env.REDIS_URL });
    redisClient.on('error', (error) => {
      app.log.warn({ error }, 'redis client error');
    });

    try {
      await redisClient.connect();
      cache = new RedisCache(redisClient);
      rateLimiter = new RedisRateLimiter(redisClient);
      cacheBackend = 'redis';
      rateLimitBackend = 'redis';
      app.log.info({ redisUrl: env.REDIS_URL }, 'redis connected');
    } catch (error) {
      app.log.warn({ error }, 'redis unavailable, fallback to memory cache and rate limiter');
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
      redisClient = undefined;
    }
  }

  await app.register(securityPlugin, { rateLimiter });
  await app.register(authPlugin);
  await app.register(errorPlugin);

  await app.register(fastifyStatic, {
    root: uploadRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });

  const userRepository = new UserRepository(path.join(dataRoot, 'users.json'));
  const postRepository = new PostRepository(path.join(dataRoot, 'posts.json'));
  const interactionRepository = new InteractionRepository(path.join(dataRoot, 'interactions.json'));
  const discoveryRepository = new DiscoveryRepository(path.join(dataRoot, 'search-trends.json'));

  const userService = new UserService(userRepository, postRepository, interactionRepository);
  const postService = new PostService(postRepository, userRepository, interactionRepository, cache);
  const interactionService = new InteractionService(
    interactionRepository,
    userRepository,
    postRepository,
    cache,
  );
  const feedService = new FeedService(postRepository, interactionRepository, userRepository, cache);
  const discoveryService = new DiscoveryService(postRepository, discoveryRepository, cache);

  if (redisClient) {
    app.addHook('onClose', async () => {
      if (!redisClient || !redisClient.isOpen) {
        return;
      }
      await redisClient.quit();
    });
  }

  app.get('/health', async () => ({
    status: 'ok',
    service: 'api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    cache: cacheBackend,
    rateLimit: {
      backend: rateLimitBackend,
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


