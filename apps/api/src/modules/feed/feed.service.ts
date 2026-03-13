import { env } from '../../config/env.js';
import type { MemoryCache } from '../../lib/cache.js';
import type { InteractionRepository } from '../interactions/interaction.repository.js';
import type { InteractionStore } from '../interactions/interaction.types.js';
import type { PostRepository } from '../posts/post.repository.js';
import type { PostRecord } from '../posts/post.types.js';
import type { FeedItem, FeedResult } from './feed.types.js';

interface PaginationInput {
  page: number;
  pageSize: number;
}

export class FeedService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly interactionRepository: InteractionRepository,
    private readonly cache?: MemoryCache,
  ) {}

  async getFollowingFeed(userId: string, query: PaginationInput): Promise<FeedResult> {
    const key = `feed:following:${userId}:${query.page}:${query.pageSize}`;
    const cached = this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
    ]);

    const followingIds = new Set(
      interactions.follows
        .filter((follow) => follow.followerId === userId)
        .map((follow) => follow.followeeId),
    );

    const items = posts
      .filter((post) => post.status === 'published' && followingIds.has(post.authorId))
      .sort(
        (left, right) =>
          new Date(right.publishedAt ?? right.updatedAt).getTime() -
          new Date(left.publishedAt ?? left.updatedAt).getTime(),
      )
      .map((post) => ({ ...post, score: this.recencyScore(post), reason: 'following' }));

    const result = this.paginate(items, query);
    this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getHotFeed(query: PaginationInput): Promise<FeedResult> {
    const key = `feed:hot:${query.page}:${query.pageSize}`;
    const cached = this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
    ]);

    const items = posts
      .filter((post) => post.status === 'published')
      .map((post) => ({
        ...post,
        score: this.computeHotScore(post, interactions),
        reason: 'hot',
      }))
      .sort((left, right) => right.score - left.score);

    const result = this.paginate(items, query);
    this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getRecommendedFeed(userId: string, query: PaginationInput): Promise<FeedResult> {
    const key = `feed:recommended:${userId}:${query.page}:${query.pageSize}`;
    const cached = this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
    ]);

    const publishedPosts = posts.filter((post) => post.status === 'published');
    const seenPostIds = new Set(
      interactions.likes.filter((item) => item.userId === userId).map((item) => item.postId),
    );
    for (const favorite of interactions.favorites.filter((item) => item.userId === userId)) {
      seenPostIds.add(favorite.postId);
    }

    const followingIds = new Set(
      interactions.follows
        .filter((item) => item.followerId === userId)
        .map((item) => item.followeeId),
    );

    const peerScores = this.computePeerScores(userId, interactions);

    const items = publishedPosts
      .filter((post) => post.authorId !== userId && !seenPostIds.has(post.id))
      .map((post) => {
        const authorAffinity = followingIds.has(post.authorId) ? 3 : 0;
        const collaborativeScore = this.computeCollaborativeScore(
          post.id,
          post.authorId,
          interactions,
          peerScores,
        );
        const engagementScore = this.computeHotScore(post, interactions) * 0.35;
        const score = collaborativeScore + authorAffinity + engagementScore;

        return {
          ...post,
          score,
          reason:
            collaborativeScore > 0 ? 'similar-users' : authorAffinity > 0 ? 'network' : 'popular',
        };
      })
      .sort((left, right) => right.score - left.score);

    const result = this.paginate(items, query);
    this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  private computePeerScores(userId: string, interactions: InteractionStore): Map<string, number> {
    const myLiked = new Set(
      interactions.likes.filter((item) => item.userId === userId).map((item) => item.postId),
    );
    const myFavorited = new Set(
      interactions.favorites.filter((item) => item.userId === userId).map((item) => item.postId),
    );
    const scores = new Map<string, number>();

    for (const like of interactions.likes) {
      if (like.userId === userId || !myLiked.has(like.postId)) {
        continue;
      }
      scores.set(like.userId, (scores.get(like.userId) ?? 0) + 2);
    }

    for (const favorite of interactions.favorites) {
      if (favorite.userId === userId || !myFavorited.has(favorite.postId)) {
        continue;
      }
      scores.set(favorite.userId, (scores.get(favorite.userId) ?? 0) + 3);
    }

    return scores;
  }

  private computeCollaborativeScore(
    postId: string,
    authorId: string,
    interactions: InteractionStore,
    peerScores: Map<string, number>,
  ): number {
    let score = 0;

    for (const like of interactions.likes) {
      if (like.postId === postId) {
        score += peerScores.get(like.userId) ?? 0;
      }
    }

    for (const favorite of interactions.favorites) {
      if (favorite.postId === postId) {
        score += (peerScores.get(favorite.userId) ?? 0) * 1.2;
      }
    }

    for (const follow of interactions.follows) {
      if (follow.followeeId === authorId) {
        score += (peerScores.get(follow.followerId) ?? 0) * 0.8;
      }
    }

    return score;
  }

  private computeHotScore(post: PostRecord, interactions: InteractionStore): number {
    const likes = interactions.likes.filter((item) => item.postId === post.id).length;
    const favorites = interactions.favorites.filter((item) => item.postId === post.id).length;
    const comments = interactions.comments.filter((item) => item.postId === post.id).length;
    const recency = this.recencyScore(post);

    return likes * 3 + favorites * 2.5 + comments * 2 + recency;
  }

  private recencyScore(post: PostRecord): number {
    const baseTime = new Date(post.publishedAt ?? post.updatedAt).getTime();
    const ageHours = Math.max(1, (Date.now() - baseTime) / (1000 * 60 * 60));
    return 48 / ageHours;
  }

  private paginate(items: FeedItem[], query: PaginationInput): FeedResult {
    const start = (query.page - 1) * query.pageSize;
    return {
      items: items.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: items.length,
    };
  }
}
