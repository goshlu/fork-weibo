import { env } from '../../config/env.js';
import type { CacheStore } from '../../lib/cache.js';
import type { z } from 'zod';

import type { PostRepository } from '../posts/post.repository.js';
import type { PostRecord } from '../posts/post.types.js';
import type { DiscoveryRepository } from './discovery.repository.js';
import type {
  ChannelSummary,
  SearchKeywordTrend,
  SearchResultItem,
  TopicTrend,
} from './discovery.types.js';
import type { searchQuerySchema } from './discovery.schemas.js';

const channelMatchers: Record<string, string[]> = {
  tech: ['ai', 'code', 'react', 'typescript', 'node', 'dev', 'tech'],
  lifestyle: ['travel', 'food', 'life', 'daily', 'lifestyle'],
  entertainment: ['movie', 'music', 'idol', 'show', 'entertainment'],
  sports: ['football', 'basketball', 'run', 'fitness', 'sports'],
};

export class DiscoveryService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly repository: DiscoveryRepository,
    private readonly cache?: CacheStore,
  ) {}

  async searchPosts(query: z.infer<typeof searchQuerySchema>): Promise<{
    items: SearchResultItem[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const key = `discovery:search:${query.q.toLowerCase()}:${query.page}:${query.pageSize}`;
    const cached = await this.cache?.get<{
      items: SearchResultItem[];
      page: number;
      pageSize: number;
      total: number;
    }>(key);
    if (cached) {
      await this.recordKeyword(query.q.trim());
      return cached;
    }

    const posts = (await this.postRepository.list()).filter((post) => post.status === 'published');
    const keyword = query.q.trim().toLowerCase();

    const items = posts
      .map((post) => this.buildSearchItem(post, keyword))
      .filter((item): item is SearchResultItem => item !== null)
      .sort((left, right) => right.score - left.score);

    await this.recordKeyword(query.q.trim());

    const result = this.paginate(items, query.page, query.pageSize);
    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getTrendingTopics(limit = 10): Promise<TopicTrend[]> {
    const key = `discovery:topics:${limit}`;
    const cached = await this.cache?.get<TopicTrend[]>(key);
    if (cached) {
      return cached;
    }

    const posts = (await this.postRepository.list()).filter((post) => post.status === 'published');
    const counter = new Map<string, number>();

    for (const post of posts) {
      for (const topic of this.extractTopics(post.content)) {
        counter.set(topic, (counter.get(topic) ?? 0) + 1);
      }
    }

    const result = [...counter.entries()]
      .map(([topic, count]) => ({ topic, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, limit);

    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getTrendingSearches(limit = 10): Promise<SearchKeywordTrend[]> {
    const key = `discovery:searches:${limit}`;
    const cached = await this.cache?.get<SearchKeywordTrend[]>(key);
    if (cached) {
      return cached;
    }

    const store = await this.repository.read();
    const result = [...store.keywords]
      .sort(
        (left, right) =>
          right.count - left.count ||
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .slice(0, limit);

    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getChannels(): Promise<ChannelSummary[]> {
    const key = 'discovery:channels';
    const cached = await this.cache?.get<ChannelSummary[]>(key);
    if (cached) {
      return cached;
    }

    const posts = (await this.postRepository.list()).filter((post) => post.status === 'published');
    const buckets = new Map<string, PostRecord[]>();

    for (const post of posts) {
      const channel = this.detectChannel(post.content);
      const list = buckets.get(channel) ?? [];
      list.push(post);
      buckets.set(channel, list);
    }

    const result = [...buckets.entries()]
      .map(([channel, items]) => ({
        channel,
        count: items.length,
        samplePostIds: items.slice(0, 3).map((item) => item.id),
      }))
      .sort((left, right) => right.count - left.count);

    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  private buildSearchItem(post: PostRecord, keyword: string): SearchResultItem | null {
    const content = post.content.toLowerCase();
    const matchedTopics = this.extractTopics(post.content).filter((topic) =>
      topic.toLowerCase().includes(keyword),
    );
    const contentMatches = content.includes(keyword);

    if (!contentMatches && matchedTopics.length === 0) {
      return null;
    }

    const exactMatches = content.split(keyword).length - 1;
    const score = exactMatches * 4 + matchedTopics.length * 6 + this.recencyBoost(post);

    return {
      ...post,
      score,
      matchedTopics,
      channel: this.detectChannel(post.content),
    };
  }

  private extractTopics(content: string): string[] {
    const matches = content.match(/#([^#\s]{1,30})/g) ?? [];
    return [...new Set(matches.map((item) => item.slice(1)))];
  }

  private detectChannel(content: string): string {
    const lowered = content.toLowerCase();

    for (const [channel, keywords] of Object.entries(channelMatchers)) {
      if (keywords.some((keyword) => lowered.includes(keyword))) {
        return channel;
      }
    }

    return 'general';
  }

  private recencyBoost(post: PostRecord): number {
    const ts = new Date(post.publishedAt ?? post.updatedAt).getTime();
    const ageHours = Math.max(1, (Date.now() - ts) / (1000 * 60 * 60));
    return 24 / ageHours;
  }

  private async recordKeyword(keyword: string): Promise<void> {
    await this.repository.update((data) => {
      const existed = data.keywords.find(
        (item) => item.keyword.toLowerCase() === keyword.toLowerCase(),
      );
      if (existed) {
        existed.count += 1;
        existed.updatedAt = new Date().toISOString();
      } else {
        data.keywords.push({
          keyword,
          count: 1,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    await this.cache?.invalidatePrefix('discovery:searches:');
  }

  private paginate<T>(
    items: T[],
    page: number,
    pageSize: number,
  ): {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
  } {
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total: items.length,
    };
  }
}
