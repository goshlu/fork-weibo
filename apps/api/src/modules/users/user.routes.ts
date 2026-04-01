import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'path';
import { pipeline } from 'node:stream/promises';

import type { FastifyInstance } from 'fastify';

import { env } from '../../config/env.js';
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from '../../plugins/auth.js';
import { toErrorResponse } from '../../utils/http.js';
import { resolveStorageDir } from '../../utils/storage-paths.js';
import { loginSchema, registerSchema, updateUserSchema } from './user.schemas.js';
import type { UserService } from './user.service.js';

const uploadRoot = resolveStorageDir(env.UPLOAD_DIR);

/**
 * 签发 JWT 并设置 httpOnly cookie
 * - Cookie 设置为 httpOnly，防止 XSS 攻击
 * - Cookie 设置为 sameSite: strict，防止 CSRF 攻击
 * - 同时返回 token 给前端兼容 Authorization header 方式
 */
async function signTokenAndSetCookie(reply: import('fastify').FastifyReply, userId: string, username: string) {
  const token = await reply.jwtSign({ userId, username });
  
  // 设置 httpOnly cookie
  reply.setCookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  
  return token;
}

export async function registerUserRoutes(
  app: FastifyInstance,
  userService: UserService,
): Promise<void> {
  app.post('/api/auth/register', async (request, reply) => {
    try {
      const payload = registerSchema.parse(request.body);
      const user = await userService.register(payload);
      const token = await signTokenAndSetCookie(reply, user.id, user.username);
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
      const token = await signTokenAndSetCookie(reply, user.id, user.username);
      return { user, token };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  // 登出：清除 auth cookie
  app.post('/api/auth/logout', async (request, reply) => {
    reply.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return { message: 'Logged out successfully' };
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
    const uploadDir = path.join(uploadRoot, request.user.userId);
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
