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

export interface InteractionStore {
  likes: LikeRecord[];
  favorites: FavoriteRecord[];
  comments: CommentRecord[];
  follows: FollowRecord[];
  notifications: NotificationRecord[];
}
