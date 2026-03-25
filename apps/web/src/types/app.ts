export type AuthMode = 'login' | 'register';
export type FeedMode = 'hot' | 'following' | 'recommended';
export type ViewMode = 'feed' | 'profile' | 'drafts' | 'notifications' | 'user' | 'post';

export type User = {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UserProfile = User & {
  stats: {
    followers: number;
    following: number;
    posts: number;
    likesReceived: number;
  };
};

export type PostImage = {
  url: string;
  width: number;
  height: number;
};

export type PostAuthor = {
  id: string;
  username: string;
  nickname: string;
  avatarUrl: string | null;
};

export type PostStats = {
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
};

export type PostViewer = {
  hasLiked: boolean;
  hasFavorited: boolean;
  isFollowingAuthor: boolean;
};

export type Post = {
  id: string;
  authorId: string;
  content: string;
  images: PostImage[];
  author?: PostAuthor | null;
  stats?: PostStats;
  viewer?: PostViewer;
  reason?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type Topic = { topic: string; count: number };
export type SearchTrend = { keyword: string; count: number };
export type Channel = { channel: string; count: number };

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  author?: PostAuthor | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  actorId: string;
  actor?: PostAuthor | null;
  type: 'like' | 'favorite' | 'comment' | 'follow';
  entityId: string;
  entityType: 'post' | 'comment' | 'user';
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResult = {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type FavoriteItem = {
  postId: string;
  folderName: string;
  createdAt: string;
  post: Post;
};

export type AuthFormState = { username: string; password: string; nickname: string };
export type ComposerState = { content: string; status: 'draft' | 'published'; images: File[] };
export type ProfileFormState = { nickname: string; bio: string; password: string };
export type ProfileTab = 'published' | 'favorites';

export const feedTitles: Record<FeedMode, string> = {
  hot: 'Hot Feed',
  following: 'Following',
  recommended: 'Recommended',
};

export const viewTitles: Record<ViewMode, string> = {
  feed: 'Feed',
  profile: 'Profile',
  drafts: 'Drafts',
  notifications: 'Notifications',
  user: 'User',
  post: 'Post',
};




