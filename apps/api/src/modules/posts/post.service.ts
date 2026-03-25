import { randomUUID } from 'node:crypto';

import type { z } from 'zod';

import type { CacheStore } from '../../lib/cache.js';
import type { InteractionStore } from '../interactions/interaction.types.js';
import type { InteractionRepository } from '../interactions/interaction.repository.js';
import type { UserRepository } from '../users/user.repository.js';
import type { UserRecord } from '../users/user.types.js';
import type { createPostSchema, listPostsQuerySchema, updatePostSchema } from './post.schemas.js';
import type { PostRepository } from './post.repository.js';
import type {
  PostAuthorSummary,
  PostImage,
  PostListItem,
  PostRecord,
  PostStats,
  PostView,
  PostViewerState,
} from './post.types.js';

const bannedWords = ['spam', '诈骗', '违禁'];

export class PostService {
  constructor(
    private readonly repository: PostRepository,
    private readonly userRepository: UserRepository,
    private readonly interactionRepository: InteractionRepository,
    private readonly cache?: CacheStore,
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
    await this.invalidateContentCaches();
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
    const [posts, users, interactions] = await Promise.all([
      this.repository.list(),
      this.userRepository.list(),
      this.interactionRepository.read(),
    ]);
    const userMap = new Map(users.map((user) => [user.id, user]));

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
    const items = sorted.slice(start, start + query.pageSize).map((post) => this.toListItem(post, userMap, interactions, requesterId));

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: sorted.length,
    };
  }

  async getPostById(id: string, requesterId?: string): Promise<PostView | undefined> {
    const [post, users, interactions] = await Promise.all([
      this.repository.findById(id),
      this.userRepository.list(),
      this.interactionRepository.read(),
    ]);
    if (!post) {
      return undefined;
    }

    if (post.status === 'draft' && post.authorId !== requesterId) {
      throw new Error('FORBIDDEN');
    }

    const userMap = new Map(users.map((user) => [user.id, user]));
    return this.toPostView(post, userMap, interactions, requesterId);
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
      await this.invalidateContentCaches();
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
      await this.invalidateContentCaches();
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

  private toListItem(
    post: PostRecord,
    userMap: Map<string, UserRecord>,
    interactions: InteractionStore,
    requesterId?: string,
  ): PostListItem {
    return {
      ...this.toPostView(post, userMap, interactions, requesterId),
      excerpt: post.content.slice(0, 120),
    };
  }

  private toPostView(
    post: PostRecord,
    userMap: Map<string, UserRecord>,
    interactions: InteractionStore,
    requesterId?: string,
  ): PostView {
    return {
      ...post,
      author: this.toAuthorSummary(userMap.get(post.authorId)),
      stats: this.toPostStats(post.id, interactions),
      viewer: requesterId ? this.toViewerState(post, interactions, requesterId) : undefined,
    };
  }

  private toAuthorSummary(user?: UserRecord): PostAuthorSummary | null {
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }

  private toPostStats(postId: string, interactions: InteractionStore): PostStats {
    return {
      likesCount: interactions.likes.filter((item) => item.postId === postId).length,
      commentsCount: interactions.comments.filter((item) => item.postId === postId).length,
      favoritesCount: interactions.favorites.filter((item) => item.postId === postId).length,
    };
  }

  private toViewerState(post: PostRecord, interactions: InteractionStore, requesterId: string): PostViewerState {
    return {
      hasLiked: interactions.likes.some((item) => item.postId === post.id && item.userId === requesterId),
      hasFavorited: interactions.favorites.some((item) => item.postId === post.id && item.userId === requesterId),
      isFollowingAuthor: post.authorId !== requesterId && interactions.follows.some(
        (item) => item.followerId === requesterId && item.followeeId === post.authorId,
      ),
    };
  }

  private async invalidateContentCaches(): Promise<void> {
    await this.cache?.invalidatePrefix('feed:');
    await this.cache?.invalidatePrefix('discovery:');
  }
}
