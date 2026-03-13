import { randomUUID } from 'node:crypto';

import type { MemoryCache } from '../../lib/cache.js';
import type { PostRepository } from '../posts/post.repository.js';
import type { PostRecord } from '../posts/post.types.js';
import type { UserRepository } from '../users/user.repository.js';
import type { InteractionRepository } from './interaction.repository.js';
import type { CommentRecord, FavoriteListItem, NotificationRecord } from './interaction.types.js';

export class InteractionService {
  constructor(
    private readonly repository: InteractionRepository,
    private readonly userRepository: UserRepository,
    private readonly postRepository: PostRepository,
    private readonly cache?: MemoryCache,
  ) {}

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
          message: 'liked your post',
        });
      }

      return {
        liked: true,
        likesCount: data.likes.filter((item) => item.postId === postId).length,
      };
    });

    this.invalidateInteractionCaches();
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

    this.invalidateInteractionCaches();
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
          message: `favorited your post into ${folderName}`,
        });
      }

      return {
        folderName,
        favoritesCount: data.favorites.filter((item) => item.postId === postId).length,
      };
    });

    this.invalidateInteractionCaches();
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

    this.invalidateInteractionCaches();
    return result;
  }

  async listFavorites(userId: string): Promise<{ items: Array<FavoriteListItem & { post: PostRecord }>; total: number }> {
    const [store, posts] = await Promise.all([this.repository.read(), this.postRepository.list()]);
    const postById = new Map(posts.map((post) => [post.id, post]));

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
          post,
        };
      })
      .filter((item): item is FavoriteListItem & { post: PostRecord } => item !== null);

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
  ): Promise<CommentRecord> {
    const post = await this.postRepository.findById(postId);
    if (!post || post.status !== 'published') {
      throw new Error('POST_NOT_FOUND');
    }

    const comment = await this.repository.update((data) => {
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
        message: parentId ? 'replied to your comment' : 'commented on your post',
      });

      return createdComment;
    });

    this.invalidateInteractionCaches();
    return comment;
  }

  async listComments(postId: string): Promise<CommentRecord[]> {
    return this.repository.update((data) => {
      return data.comments
        .filter((item) => item.postId === postId)
        .sort(
          (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        );
    });
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
          message: 'started following you',
        });
      }

      return {
        following: true,
        followersCount: data.follows.filter((item) => item.followeeId === followeeId).length,
      };
    });

    this.invalidateInteractionCaches();
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

    this.invalidateInteractionCaches();
    return result;
  }

  async listNotifications(userId: string): Promise<NotificationRecord[]> {
    return this.repository.update((data) => {
      return data.notifications
        .filter((item) => item.userId === userId)
        .sort(
          (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
        );
    });
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

  private invalidateInteractionCaches(): void {
    this.cache?.invalidatePrefix('feed:');
  }
}
