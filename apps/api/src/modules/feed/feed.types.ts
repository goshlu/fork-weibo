import type { PostView } from '../posts/post.types.js';

export interface FeedItem extends PostView {
  score: number;
  reason: string;
}

export interface FeedResult {
  items: FeedItem[];
  page: number;
  pageSize: number;
  total: number;
}
