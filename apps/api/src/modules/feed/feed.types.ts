import type { PostRecord } from '../posts/post.types.js';

export interface FeedItem extends PostRecord {
  score: number;
  reason: string;
}

export interface FeedResult {
  items: FeedItem[];
  page: number;
  pageSize: number;
  total: number;
}
