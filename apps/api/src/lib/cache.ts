import type { RedisClientType } from 'redis';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

type ScanReply =
  | { cursor: number | string; keys: string[] }
  | [string, string[]];

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePrefix(prefix: string): Promise<void>;
}

export class MemoryCache implements CacheStore {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}

export class RedisCache implements CacheStore {
  constructor(
    private readonly client: RedisClientType,
    private readonly namespace = 'fork-weibo:cache:',
  ) {}

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.client.get(this.toKey(key));
    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    await this.client.set(this.toKey(key), JSON.stringify(value), { PX: ttlMs });
  }

  async delete(key: string): Promise<void> {
    await this.client.del(this.toKey(key));
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    const pattern = `${this.namespace}${prefix}*`;
    let cursor = 0;

    do {
      const scanResult = (await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      })) as ScanReply;

      const nextCursor = Number(Array.isArray(scanResult) ? scanResult[0] : scanResult.cursor);
      const keys = Array.isArray(scanResult) ? scanResult[1] : scanResult.keys;

      if (keys.length > 0) {
        await this.client.del(keys);
      }

      cursor = nextCursor;
    } while (cursor !== 0);
  }

  private toKey(key: string): string {
    return `${this.namespace}${key}`;
  }
}
