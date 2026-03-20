import type { PostAuthorSummary } from '../posts/post.types.js';

export interface LikeRecord {
  userId: string;
  postId: string;
  createdAt: string;
}

export interface FavoriteRecord {
  userId: string;
  postId: string;
  folderName: string;
  createdAt: string;
}

export interface CommentRecord {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommentView extends CommentRecord {
  author: PostAuthorSummary | null;
}

export interface FollowRecord {
  followerId: string;
  followeeId: string;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  actorId: string;
  type: 'like' | 'favorite' | 'comment' | 'follow';
  entityId: string;
  entityType: 'post' | 'comment' | 'user';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationView extends NotificationRecord {
  actor: PostAuthorSummary | null;
}

export interface InteractionStore {
  likes: LikeRecord[];
  favorites: FavoriteRecord[];
  comments: CommentRecord[];
  follows: FollowRecord[];
  notifications: NotificationRecord[];
}

export interface FavoriteListItem {
  postId: string;
  folderName: string;
  createdAt: string;
}

