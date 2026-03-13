import { randomUUID } from 'node:crypto';

import type { z } from 'zod';

import type { MemoryCache } from '../../lib/cache.js';
import type { createPostSchema, listPostsQuerySchema, updatePostSchema } from './post.schemas.js';
import type { PostRepository } from './post.repository.js';
import type { PostImage, PostListItem, PostRecord } from './post.types.js';

const bannedWords = ['spam', '诈骗', '违禁'];

export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly cache?: MemoryCache,
  ) {}

  async createPost(
    authorId: string,
    input: z.infer<typeof createPostSchema>,
    images: PostImage[],
  ): Promise<PostRecord> {
    this.assertSafeContent(input.content);

    const now = new Date().toISOString();
    const status = input.status ?? 'published';
    const post: PostRecord = {
      id: randomUUID(),
      authorId,
      content: input.content,
      images,
      status,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    };

    await this.repository.insert(post);
    this.invalidateContentCaches();
    return post;
  }

  async listPosts(
    query: z.infer<typeof listPostsQuerySchema>,
    requesterId?: string,
  ): Promise<{
    items: PostListItem[];
    page: number;
    pageSize: number;
    total: number;
  }> {
    const posts = await this.repository.list();
    const filtered = posts.filter((post) => {
      if (query.authorId && post.authorId !== query.authorId) {
        return false;
      }

      if (query.status) {
        if (query.status === 'draft') {
          return post.status === 'draft' && post.authorId === requesterId;
        }
        return post.status === query.status;
      }

      return post.status === 'published' || post.authorId === requesterId;
    });

    const sorted = filtered.sort((left, right) => {
      const leftTime = new Date(left.updatedAt).getTime();
      const rightTime = new Date(right.updatedAt).getTime();
      return query.sort === 'oldest' ? leftTime - rightTime : rightTime - leftTime;
    });

    const start = (query.page - 1) * query.pageSize;
    const items = sorted.slice(start, start + query.pageSize).map((post) => this.toListItem(post));

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: sorted.length,
    };
  }

  async getPostById(id: string, requesterId?: string): Promise<PostRecord | undefined> {
    const post = await this.repository.findById(id);
    if (!post) {
      return undefined;
    }

    if (post.status === 'draft' && post.authorId !== requesterId) {
      throw new Error('FORBIDDEN');
    }

    return post;
  }

  async updatePost(
    id: string,
    authorId: string,
    input: z.infer<typeof updatePostSchema>,
    images?: PostImage[],
  ): Promise<PostRecord | undefined> {
    if (input.content) {
      this.assertSafeContent(input.content);
    }

    const updated = await this.repository.update(id, (post: PostRecord) => {
      if (post.authorId !== authorId) {
        throw new Error('FORBIDDEN');
      }

      const nextStatus = input.status ?? post.status;
      return {
        ...post,
        content: input.content ?? post.content,
        images: images ?? post.images,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
        publishedAt:
          post.publishedAt ?? (nextStatus === 'published' ? new Date().toISOString() : null),
      };
    });

    if (updated) {
      this.invalidateContentCaches();
    }

    return updated;
  }

  async deletePost(id: string, authorId: string): Promise<boolean> {
    const post = await this.repository.findById(id);
    if (!post) {
      return false;
    }

    if (post.authorId !== authorId) {
      throw new Error('FORBIDDEN');
    }

    const removed = await this.repository.delete(id);
    if (removed) {
      this.invalidateContentCaches();
    }
    return removed;
  }

  private assertSafeContent(content: string): void {
    const lowered = content.toLowerCase();
    const matched = bannedWords.find((word) => lowered.includes(word.toLowerCase()));
    if (matched) {
      throw new Error('SENSITIVE_CONTENT');
    }
  }

  private toListItem(post: PostRecord): PostListItem {
    return {
      ...post,
      excerpt: post.content.slice(0, 120),
    };
  }

  private invalidateContentCaches(): void {
    this.cache?.invalidatePrefix('feed:');
    this.cache?.invalidatePrefix('discovery:');
  }
}
