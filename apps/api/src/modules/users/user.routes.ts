import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import type { FastifyInstance } from 'fastify';

import { env } from '../../config/env.js';
import { toErrorResponse } from '../../utils/http.js';
import { loginSchema, registerSchema, updateUserSchema } from './user.schemas.js';
import type { UserService } from './user.service.js';

export async function registerUserRoutes(
  app: FastifyInstance,
  userService: UserService,
): Promise<void> {
  app.post('/api/auth/register', async (request, reply) => {
    try {
      const payload = registerSchema.parse(request.body);
      const user = await userService.register(payload);
      const token = await reply.jwtSign({ userId: user.id, username: user.username });
      return reply.code(201).send({ user, token });
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.post('/api/auth/login', async (request, reply) => {
    try {
      const payload = loginSchema.parse(request.body);
      const user = await userService.login(payload);
      const token = await reply.jwtSign({ userId: user.id, username: user.username });
      return { user, token };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/users/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = await userService.getPublicUser(request.user.userId);
    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }
    return { user };
  });

  app.patch('/api/users/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const payload = updateUserSchema.parse(request.body);
      const user = await userService.updateUser(request.user.userId, payload);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return { user };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.post('/api/users/me/avatar', { preHandler: [app.authenticate] }, async (request, reply) => {
    const file = await request.file();
    if (!file) {
      return reply.code(400).send({ message: 'Avatar file is required' });
    }

    if (!file.mimetype.startsWith('image/')) {
      return reply.code(400).send({ message: 'Avatar must be an image file' });
    }

    const extension = path.extname(file.filename || '').toLowerCase() || '.bin';
    const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR, request.user.userId);
    await mkdir(uploadDir, { recursive: true });
    const fileName = `avatar-${Date.now()}${extension}`;
    const destination = path.join(uploadDir, fileName);

    await pipeline(file.file, createWriteStream(destination));

    const avatarUrl = `/uploads/${request.user.userId}/${fileName}`;
    const user = await userService.updateAvatar(request.user.userId, avatarUrl);
    return { user };
  });

  app.get('/api/users/:id/profile', async (request, reply) => {
    const params = request.params as { id: string };
    const profile = await userService.getProfile(params.id);
    if (!profile) {
      return reply.code(404).send({ message: 'User not found' });
    }
    return { profile };
  });
}
