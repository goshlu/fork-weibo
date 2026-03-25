import type { RedisClientType } from 'redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly bucket = new Map<string, RateLimitEntry>();

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const current = this.bucket.get(key);

    if (!current || now > current.resetAt) {
      this.bucket.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        retryAfterSeconds: Math.ceil(windowMs / 1000),
      };
    }

    current.count += 1;
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    if (current.count > limit) {
      return {
        allowed: false,
        retryAfterSeconds,
      };
    }

    return {
      allowed: true,
      retryAfterSeconds,
    };
  }
}

const redisRateLimiterScript = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local windowMs = tonumber(ARGV[2])

local current = redis.call('INCR', key)
if current == 1 then
  redis.call('PEXPIRE', key, windowMs)
end

local ttl = redis.call('PTTL', key)
if ttl < 0 then
  ttl = windowMs
end

if current > limit then
  return {0, ttl}
end

return {1, ttl}
`;

export class RedisRateLimiter implements RateLimiter {
  constructor(
    private readonly client: RedisClientType,
    private readonly namespace = 'fork-weibo:ratelimit:',
  ) {}

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const reply = await this.client.eval(redisRateLimiterScript, {
      keys: [this.toKey(key)],
      arguments: [String(limit), String(windowMs)],
    });

    const [allowedRaw, ttlRaw] = Array.isArray(reply) ? reply : [0, windowMs];
    const allowed = Number(allowedRaw) === 1;
    const ttlMs = Number(ttlRaw);

    return {
      allowed,
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    };
  }

  private toKey(key: string): string {
    return `${this.namespace}${key}`;
  }
}
