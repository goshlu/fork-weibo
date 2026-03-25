import { randomUUID } from 'node:crypto';

import type { CacheStore } from '../../lib/cache.js';
import type { PostAuthorSummary, PostStats, PostView, PostViewerState } from '../posts/post.types.js';
import type { PostRepository } from '../posts/post.repository.js';
import type { PostRecord } from '../posts/post.types.js';
import type { UserRepository } from '../users/user.repository.js';
import type { UserRecord } from '../users/user.types.js';
import type { InteractionRepository } from './interaction.repository.js';
import type {
  CommentRecord,
  CommentView,
  FavoriteListItem,
  InteractionStore,
  NotificationListQuery,
  NotificationListResult,
  NotificationRecord,
} from './interaction.types.js';

export class InteractionService {
  constructor(
    private readonly repository: InteractionRepository,
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly cache?: CacheStore,
  ) { }

  async likePost(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') {
      throw new Error('POST_NOT_FOUND');
    }

    const result = await this.repository.update((data) => {
      const existed = data.likes.find((item) => item.userId === userId && item.postId === postId);
      if (!existed) {
        data.likes.push({ userId, postId, createdAt: new Date().toISOString() });
        this.appendNotification(data.notifications, {
          userId: post.authorId,
          actorId: userId,
          type: 'like',
          entityId: postId,
          entityType: 'post',
          message: 'Someone liked your post.',
        });
      }

      return {
        liked: true,
        likesCount: data.likes.filter((item) => item.postId === postId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async unlikePost(
    userId: string,
    postId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const result = await this.repository.update((data) => {
      data.likes = data.likes.filter((item) => !(item.userId === userId && item.postId === postId));
      return {
        liked: false,
        likesCount: data.likes.filter((item) => item.postId === postId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async favoritePost(
    userId: string,
    postId: string,
    folderName: string,
  ): Promise<{ folderName: string; favoritesCount: number }> {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') {
      throw new Error('POST_NOT_FOUND');
    }

    const result = await this.repository.update((data) => {
      const existed = data.favorites.find(
        (item) =>
          item.userId === userId && item.postId === postId && item.folderName === folderName,
      );
      if (!existed) {
        data.favorites.push({ userId, postId, folderName, createdAt: new Date().toISOString() });
        this.appendNotification(data.notifications, {
          userId: post.authorId,
          actorId: userId,
          type: 'favorite',
          entityId: postId,
          entityType: 'post',
          message: `Someone saved your post to "${folderName}".`,
        });
      }

      return {
        folderName,
        favoritesCount: data.favorites.filter((item) => item.postId === postId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async unfavoritePost(
    userId: string,
    postId: string,
    folderName: string,
  ): Promise<{ favoritesCount: number }> {
    const result = await this.repository.update((data) => {
      data.favorites = data.favorites.filter(
        (item) =>
          !(item.userId === userId && item.postId === postId && item.folderName === folderName),
      );
      return {
        favoritesCount: data.favorites.filter((item) => item.postId === postId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async listFavorites(userId: string): Promise<{ items: Array<FavoriteListItem & { post: PostView }>; total: number }> {
    const [store, posts, users] = await Promise.all([
      this.repository.read(),
      this.postRepository.list(),
      this.userRepository.list(),
    ]);
    const postById = new Map(posts.map((post) => [post.id, post]));
    const userMap = new Map(users.map((user) => [user.id, user]));

    const items = store.favorites
      .filter((item) => item.userId === userId)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((item) => {
        const post = postById.get(item.postId);
        if (!post || post.status !== 'published') {
          return null;
        }

        return {
          postId: item.postId,
          folderName: item.folderName,
          createdAt: item.createdAt,
          post: this.toPostView(post, userMap, store, userId),
        };
      })
      .filter((item): item is FavoriteListItem & { post: PostView } => item !== null);

    return {
      items,
      total: items.length,
    };
  }

  async addComment(
    userId: string,
    postId: string,
    content: string,
    parentId?: string,
  ): Promise<CommentView> {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') {
      throw new Error('POST_NOT_FOUND');
    }

    const [comment, author] = await Promise.all([
      this.repository.update((data) => {
        let replyTargetUserId = post.authorId;
        if (parentId) {
          const parent = data.comments.find((item) => item.id === parentId && item.postId === postId);
          if (!parent) {
            throw new Error('COMMENT_NOT_FOUND');
          }
          replyTargetUserId = parent.authorId;
        }

        const now = new Date().toISOString();
        const createdComment: CommentRecord = {
          id: randomUUID(),
          postId,
          authorId: userId,
          parentId: parentId ?? null,
          content,
          createdAt: now,
          updatedAt: now,
        };

        data.comments.push(createdComment);
        this.appendNotification(data.notifications, {
          userId: replyTargetUserId,
          actorId: userId,
          type: 'comment',
          entityId: createdComment.id,
          entityType: 'comment',
          message: parentId ? 'Someone replied to your comment.' : 'Someone commented on your post.',
        });

        return createdComment;
      }),
      this.userRepository.findById(userId),
    ]);

    await this.invalidateInteractionCaches();
    return this.toCommentView(comment, author);
  }

  async listComments(postId: string): Promise<CommentView[]> {
    const [store, users] = await Promise.all([this.repository.read(), this.userRepository.list()]);
    const userMap = new Map(users.map((user) => [user.id, user]));

    return store.comments
      .filter((item) => item.postId === postId)
      .sort(
        (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
      )
      .map((comment) => this.toCommentView(comment, userMap.get(comment.authorId)));
  }

  async getCommentById(commentId: string): Promise<CommentView | null> {
    const [store, users] = await Promise.all([this.repository.read(), this.userRepository.list()]);
    const comment = store.comments.find((item) => item.id === commentId);
    if (!comment) return null;
    const author = users.find((user) => user.id === comment.authorId);
    return this.toCommentView(comment, author);
  }
  async followUser(
    followerId: string,
    followeeId: string,
  ): Promise<{ following: boolean; followersCount: number }> {
    if (followerId === followeeId) {
      throw new Error('INVALID_FOLLOW');
    }

    const followee = await this.userRepository.findById(followeeId);
    if (!followee) {
      throw new Error('USER_NOT_FOUND');
    }

    const result = await this.repository.update((data) => {
      const existed = data.follows.find(
        (item) => item.followerId === followerId && item.followeeId === followeeId,
      );

      if (!existed) {
        data.follows.push({ followerId, followeeId, createdAt: new Date().toISOString() });
        this.appendNotification(data.notifications, {
          userId: followeeId,
          actorId: followerId,
          type: 'follow',
          entityId: followeeId,
          entityType: 'user',
          message: 'Someone started following you.',
        });
      }

      return {
        following: true,
        followersCount: data.follows.filter((item) => item.followeeId === followeeId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async unfollowUser(
    followerId: string,
    followeeId: string,
  ): Promise<{ following: boolean; followersCount: number }> {
    const result = await this.repository.update((data) => {
      data.follows = data.follows.filter(
        (item) => !(item.followerId === followerId && item.followeeId === followeeId),
      );
      return {
        following: false,
        followersCount: data.follows.filter((item) => item.followeeId === followeeId).length,
      };
    });

    await this.invalidateInteractionCaches();
    return result;
  }

  async listNotifications(userId: string, query: NotificationListQuery): Promise<NotificationListResult> {
    const [store, users] = await Promise.all([this.repository.read(), this.userRepository.list()]);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const sorted = store.notifications
      .filter((item) => item.userId === userId)
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      )
      .map((item) => {
        const actor = this.toAuthorSummary(userMap.get(item.actorId));
        return {
          ...item,
          actor,
          message: this.toNotificationMessage(item, actor),
        };
      });

    const start = (query.page - 1) * query.pageSize;
    const items = sorted.slice(start, start + query.pageSize);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total: sorted.length,
      hasMore: start + items.length < sorted.length,
    };
  }

  async markNotificationsRead(userId: string): Promise<{ updated: number }> {
    return this.repository.update((data) => {
      let updated = 0;
      data.notifications = data.notifications.map((item) => {
        if (item.userId !== userId || item.isRead) {
          return item;
        }
        updated += 1;
        return { ...item, isRead: true };
      });
      return { updated };
    });
  }

  async markNotificationRead(userId: string, notificationId: string): Promise<{ updated: number }> {
    return this.repository.update((data) => {
      let updated = 0;
      data.notifications = data.notifications.map((item) => {
        if (item.userId !== userId || item.id !== notificationId || item.isRead) {
          return item;
        }
        updated += 1;
        return { ...item, isRead: true };
      });
      return { updated };
    });
  }

  private toPostView(post: PostRecord, userMap: Map<string, UserRecord>, store: InteractionStore, requesterId?: string): PostView {
    return {
      ...post,
      author: this.toAuthorSummary(userMap.get(post.authorId)),
      stats: this.toPostStats(post.id, store),
      viewer: requesterId ? this.toViewerState(post, store, requesterId) : undefined,
    };
  }

  private toCommentView(comment: CommentRecord, user?: UserRecord): CommentView {
    return {
      ...comment,
      author: this.toAuthorSummary(user),
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

  private toPostStats(postId: string, store: InteractionStore): PostStats {
    return {
      likesCount: store.likes.filter((item) => item.postId === postId).length,
      commentsCount: store.comments.filter((item) => item.postId === postId).length,
      favoritesCount: store.favorites.filter((item) => item.postId === postId).length,
    };
  }

  private toViewerState(post: PostRecord, store: InteractionStore, requesterId: string): PostViewerState {
    return {
      hasLiked: store.likes.some((item) => item.postId === post.id && item.userId === requesterId),
      hasFavorited: store.favorites.some((item) => item.postId === post.id && item.userId === requesterId),
      isFollowingAuthor: post.authorId !== requesterId && store.follows.some(
        (item) => item.followerId === requesterId && item.followeeId === post.authorId,
      ),
    };
  }

  private toNotificationMessage(
    notification: NotificationRecord,
    actor: PostAuthorSummary | null,
  ): string {
    const actorLabel = actor?.nickname?.trim() || actor?.username?.trim() || 'Someone';
    const folderMatch = notification.message.match(/^Someone saved your post to "(.+)"\.$/);

    if (notification.message === 'liked your post' || notification.message === 'Someone liked your post.') {
      return `${actorLabel} liked your post.`;
    }

    if (
      notification.message === 'replied to your comment' ||
      notification.message === 'Someone replied to your comment.'
    ) {
      return `${actorLabel} replied to your comment.`;
    }

    if (
      notification.message === 'commented on your post' ||
      notification.message === 'Someone commented on your post.'
    ) {
      return `${actorLabel} commented on your post.`;
    }

    if (
      notification.message === 'started following you' ||
      notification.message === 'Someone started following you.'
    ) {
      return `${actorLabel} started following you.`;
    }

    if (folderMatch) {
      return `${actorLabel} saved your post to "${folderMatch[1]}".`;
    }

    if (/^Someone [^.]+\.$/.test(notification.message)) {
      return notification.message.replace(/^Someone/, actorLabel);
    }

    return notification.message;
  }
  private appendNotification(
    notifications: NotificationRecord[],
    input: Omit<NotificationRecord, 'id' | 'isRead' | 'createdAt'>,
  ): void {
    if (input.userId === input.actorId) {
      return;
    }

    notifications.push({
      id: randomUUID(),
      ...input,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  private async invalidateInteractionCaches(): Promise<void> {
    await this.cache?.invalidatePrefix('feed:');
  }
}








