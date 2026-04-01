import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import type { FastifyRequest } from 'fastify';

import { env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: Record<string, string | undefined>;
  }
}

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

// Cookie 名称常量
const AUTH_COOKIE_NAME = 'auth_token';

/**
 * 生成设置 auth token cookie 的选项
 * - httpOnly: 防止 XSS 攻击窃取
 * - secure: 仅在 HTTPS 下发送（生产环境）
 * - sameSite: 防止 CSRF 攻击
 * - maxAge: 7 天过期
 */
export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  };
}

export { AUTH_COOKIE_NAME };

export const authPlugin = fp(async (app) => {
  // 注册 @fastify/cookie 以支持 cookie 认证
  await app.register(import('@fastify/cookie'), {
    secret: env.JWT_SECRET, // 使用 JWT_SECRET 作为 cookie 签名密钥
    hook: 'onRequest',
  });

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: AUTH_COOKIE_NAME,
      signed: false, // JWT 本身已有签名
    },
  });

  // 增强认证装饰器：支持 Bearer Token 或 Cookie
  app.decorate(
    'authenticate',
    async function authenticate(request: import('fastify').FastifyRequest) {
      // 优先使用 Authorization Header
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        await request.jwtVerify();
        return;
      }

      // 降级使用 Cookie
      const cookieToken = request.cookies[AUTH_COOKIE_NAME];
      if (cookieToken) {
        await request.jwtVerify();
        return;
      }

      // 两者都没有，抛出认证错误
      throw new Error('Authentication required');
    },
  );

  // 可选的认证装饰器：支持 Bearer Token 或 Cookie
  app.decorate(
    'authenticateOptional',
    async function authenticateOptional(request: import('fastify').FastifyRequest) {
      const authHeader = request.headers.authorization;
      const cookieToken = request.cookies[AUTH_COOKIE_NAME];

      if (!authHeader && !cookieToken) {
        return; // 两者都没有，直接返回
      }

      try {
        await request.jwtVerify();
      } catch {
        // 认证失败，静默忽略（可选认证）
      }
    },
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest) => Promise<void>;
    authenticateOptional: (request: import('fastify').FastifyRequest) => Promise<void>;
  }
}
