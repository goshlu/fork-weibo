import { env } from '../../config/env.js';
import type { CacheStore } from '../../lib/cache.js';
import type { InteractionRepository } from '../interactions/interaction.repository.js';
import type { InteractionStore } from '../interactions/interaction.types.js';
import type { PostRepository } from '../posts/post.repository.js';
import type {
  PostAuthorSummary,
  PostRecord,
  PostStats,
  PostViewerState,
} from '../posts/post.types.js';
import type { UserRepository } from '../users/user.repository.js';
import type { UserRecord } from '../users/user.types.js';
import type { FeedItem, FeedResult } from './feed.types.js';

interface PaginationInput {
  page: number;
  pageSize: number;
}

export class FeedService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly interactionRepository: InteractionRepository,
    private readonly userRepository: UserRepository,
    private readonly cache?: CacheStore,
  ) {}

  async getFollowingFeed(userId: string, query: PaginationInput): Promise<FeedResult> {
    const key = `feed:following:${userId}:${query.page}:${query.pageSize}`;
    const cached = await this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions, users] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
      this.userRepository.list(),
    ]);
    const userMap = new Map(users.map((user) => [user.id, user]));

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
      .map((post) => this.toFeedItem(post, userMap, interactions, this.recencyScore(post), 'following', userId));

    const result = this.paginate(items, query);
    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getHotFeed(query: PaginationInput, requesterId?: string): Promise<FeedResult> {
    const key = `feed:hot:${requesterId ?? 'guest'}:${query.page}:${query.pageSize}`;
    const cached = await this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions, users] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
      this.userRepository.list(),
    ]);
    const userMap = new Map(users.map((user) => [user.id, user]));

    const items = posts
      .filter((post) => post.status === 'published')
      .map((post) => this.toFeedItem(post, userMap, interactions, this.computeHotScore(post, interactions), 'hot', requesterId))
      .sort((left, right) => right.score - left.score);

    const result = this.paginate(items, query);
    await this.cache?.set(key, result, env.CACHE_TTL_MS);
    return result;
  }

  async getRecommendedFeed(userId: string, query: PaginationInput): Promise<FeedResult> {
    const key = `feed:recommended:${userId}:${query.page}:${query.pageSize}`;
    const cached = await this.cache?.get<FeedResult>(key);
    if (cached) {
      return cached;
    }

    const [posts, interactions, users] = await Promise.all([
      this.postRepository.list(),
      this.interactionRepository.read(),
      this.userRepository.list(),
    ]);
    const userMap = new Map(users.map((user) => [user.id, user]));

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
        const reason = collaborativeScore > 0 ? 'similar-users' : authorAffinity > 0 ? 'network' : 'popular';

        return this.toFeedItem(post, userMap, interactions, score, reason, userId);
      })
      .sort((left, right) => right.score - left.score);

    const result = this.paginate(items, query);
    await this.cache?.set(key, result, env.CACHE_TTL_MS);
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

  private toFeedItem(
    post: PostRecord,
    userMap: Map<string, UserRecord>,
    interactions: InteractionStore,
    score: number,
    reason: string,
    requesterId?: string,
  ): FeedItem {
    return {
      ...post,
      author: this.toAuthorSummary(userMap.get(post.authorId)),
      stats: this.toPostStats(post.id, interactions),
      viewer: requesterId ? this.toViewerState(post, interactions, requesterId) : undefined,
      score,
      reason,
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
