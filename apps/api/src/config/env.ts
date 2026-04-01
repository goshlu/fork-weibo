import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: '../../.env', quiet: true });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  REDIS_URL: z.string().url().optional(),
  UPLOAD_DIR: z.string().default('apps/api/uploads'),
  DATA_DIR: z.string().default('apps/api/data'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(15_000),
  TRUST_PROXY: z.enum(['true', 'false']).default('false'),
  // CORS 配置：多个域名用逗号分隔，不配置则允许所有来源
  CORS_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  DATA_DIR: process.env.DATA_DIR,
  RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  CACHE_TTL_MS: process.env.CACHE_TTL_MS,
  TRUST_PROXY: process.env.TRUST_PROXY,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});
