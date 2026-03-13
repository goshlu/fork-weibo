export type AuthMode = 'login' | 'register';
export type FeedMode = 'hot' | 'following' | 'recommended';
export type ViewMode = 'feed' | 'profile' | 'drafts' | 'notifications';

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

export type Post = {
  id: string;
  authorId: string;
  content: string;
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
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  actorId: string;
  type: 'like' | 'favorite' | 'comment' | 'follow';
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type FavoriteItem = {
  postId: string;
  folderName: string;
  createdAt: string;
  post: Post;
};

export type AuthFormState = { username: string; password: string; nickname: string };
export type ComposerState = { content: string; status: 'draft' | 'published' };
export type ProfileFormState = { nickname: string; bio: string; password: string };

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
};
