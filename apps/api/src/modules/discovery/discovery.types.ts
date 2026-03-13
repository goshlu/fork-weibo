import type { PostRecord } from '../posts/post.types.js';

export interface SearchResultItem extends PostRecord {
  score: number;
  matchedTopics: string[];
  channel: string;
}

export interface TopicTrend {
  topic: string;
  count: number;
}

export interface SearchKeywordTrend {
  keyword: string;
  count: number;
  updatedAt: string;
}

export interface ChannelSummary {
  channel: string;
  count: number;
  samplePostIds: string[];
}

export interface SearchTrendStore {
  keywords: SearchKeywordTrend[];
}
