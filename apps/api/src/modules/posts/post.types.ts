import type { PublicUser } from '../users/user.types.js';

export interface PostImage {
  url: string;
  width: number;
  height: number;
}

export interface PostRecord {
  id: string;
  authorId: string;
  content: string;
  images: PostImage[];
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type PostAuthorSummary = Pick<PublicUser, 'id' | 'username' | 'nickname' | 'avatarUrl'>;

export interface PostStats {
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
}

export interface PostViewerState {
  hasLiked: boolean;
  hasFavorited: boolean;
  isFollowingAuthor: boolean;
}

export interface PostView extends PostRecord {
  author: PostAuthorSummary | null;
  stats: PostStats;
  viewer?: PostViewerState;
  reason?: string;
}

export interface PostListItem extends PostView {
  excerpt: string;
}
