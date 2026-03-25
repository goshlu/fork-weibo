import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDashboard } from './useDashboard';
import { I18nProvider } from '../i18n';
import type { FeedMode, Post } from '../types/app';

vi.mock('../services/api', () => ({
  api: {
    getTopics: vi.fn(),
    getSearchTrends: vi.fn(),
    getChannels: vi.fn(),
    getFeed: vi.fn(),
    getMyUser: vi.fn(),
    getProfile: vi.fn(),
    getPosts: vi.fn(),
    getNotifications: vi.fn(),
    getFavorites: vi.fn(),
    markNotificationsRead: vi.fn(),
    markNotificationRead: vi.fn(),
    getNotificationStreamUrl: vi.fn(),
    getComment: vi.fn(),
    getPost: vi.fn(),
    getComments: vi.fn(),
  },
}));

import { api } from '../services/api';

function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );
}

function createMockPost(overrides: Partial<Post> = {}): Post {
  return {
    id: `post-${Math.random().toString(36).slice(2)}`,
    authorId: 'author-1',
    content: 'hello',
    images: [],
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createFeedPage(items: Post[], options: { page?: number; pageSize?: number; total?: number } = {}) {
  return {
    items,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 10,
    total: options.total ?? items.length,
  };
}

describe('useDashboard - feed pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(api.getTopics).mockResolvedValue({ items: [] });
    vi.mocked(api.getSearchTrends).mockResolvedValue({ items: [] });
    vi.mocked(api.getChannels).mockResolvedValue({ items: [] });
    vi.mocked(api.getFeed).mockResolvedValue(createFeedPage([], { page: 1, pageSize: 10, total: 0 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads first feed page on init', async () => {
    const items = [createMockPost({ id: 'post-1' }), createMockPost({ id: 'post-2' })];
    vi.mocked(api.getFeed).mockResolvedValueOnce(createFeedPage(items, { page: 1, pageSize: 10, total: 12 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.state.posts).toHaveLength(2);
    });

    expect(api.getFeed).toHaveBeenCalledWith('hot', undefined, { page: 1, pageSize: 10 });
    expect(result.current.state.feedPage).toBe(1);
    expect(result.current.state.feedHasMore).toBe(true);
  });

  it('appends posts when loading more feed', async () => {
    const first = Array.from({ length: 10 }, (_, i) => createMockPost({ id: `post-${i}` }));
    const second = [createMockPost({ id: 'post-10' }), createMockPost({ id: 'post-11' })];

    vi.mocked(api.getFeed)
      .mockResolvedValueOnce(createFeedPage(first, { page: 1, pageSize: 10, total: 12 }))
      .mockResolvedValueOnce(createFeedPage(second, { page: 2, pageSize: 10, total: 12 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.state.posts).toHaveLength(10);
    });

    await act(async () => {
      await result.current.actions.loadMoreFeed();
    });

    expect(api.getFeed).toHaveBeenNthCalledWith(2, 'hot', undefined, { page: 2, pageSize: 10 });
    expect(result.current.state.posts).toHaveLength(12);
    expect(result.current.state.feedPage).toBe(2);
    expect(result.current.state.feedHasMore).toBe(false);
  });

  it('does not load more when feed has no more pages', async () => {
    const items = [createMockPost({ id: 'post-1' })];
    vi.mocked(api.getFeed).mockResolvedValueOnce(createFeedPage(items, { page: 1, pageSize: 10, total: 1 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.state.posts).toHaveLength(1);
    });

    await act(async () => {
      await result.current.actions.loadMoreFeed();
    });

    expect(api.getFeed).toHaveBeenCalledTimes(1);
    expect(result.current.state.feedHasMore).toBe(false);
  });

  it('sets message when loadMoreFeed fails', async () => {
    vi.mocked(api.getFeed)
      .mockResolvedValueOnce(createFeedPage([createMockPost({ id: 'post-1' })], { page: 1, pageSize: 10, total: 11 }))
      .mockRejectedValueOnce(new Error('feed load failed'));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.state.posts).toHaveLength(1);
    });

    await act(async () => {
      await result.current.actions.loadMoreFeed();
    });

    expect(result.current.state.message).toBe('feed load failed');
    expect(result.current.state.feedPage).toBe(1);
  });

  it('resets to page 1 when switching feed mode', async () => {
    const hotItems = [createMockPost({ id: 'hot-1' })];
    const followingItems = [createMockPost({ id: 'follow-1' })];
    vi.mocked(api.getFeed)
      .mockResolvedValueOnce(createFeedPage(hotItems, { page: 1, pageSize: 10, total: 1 }))
      .mockResolvedValueOnce(createFeedPage(followingItems, { page: 1, pageSize: 10, total: 1 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.state.posts[0]?.id).toBe('hot-1');
    });

    await act(async () => {
      result.current.actions.setFeedMode('following' as FeedMode);
    });

    await waitFor(() => {
      expect(result.current.state.posts[0]?.id).toBe('follow-1');
    });

    expect(result.current.state.feedPage).toBe(1);
    expect(api.getFeed).toHaveBeenNthCalledWith(2, 'following', undefined, { page: 1, pageSize: 10 });
  });
});
