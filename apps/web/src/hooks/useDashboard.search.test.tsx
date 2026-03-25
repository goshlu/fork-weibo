import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useDashboard } from './useDashboard';
import { I18nProvider } from '../i18n';
import type { Post } from '../types/app';

vi.mock('../services/api', () => ({
  api: {
    getTopics: vi.fn(),
    getSearchTrends: vi.fn(),
    getChannels: vi.fn(),
    getFeed: vi.fn(),
    search: vi.fn(),
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
    content: 'search content',
    images: [],
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createSearchPage(items: Post[], options: { page?: number; pageSize?: number; total?: number } = {}) {
  return {
    items,
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 8,
    total: options.total ?? items.length,
  };
}

describe('useDashboard - search pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(api.getTopics).mockResolvedValue({ items: [] });
    vi.mocked(api.getSearchTrends).mockResolvedValue({ items: [] });
    vi.mocked(api.getChannels).mockResolvedValue({ items: [] });
    vi.mocked(api.getFeed).mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
    vi.mocked(api.search).mockResolvedValue(createSearchPage([]));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads first search page when keyword changes', async () => {
    const page1 = Array.from({ length: 8 }, (_, i) => createMockPost({ id: `post-${i}` }));
    vi.mocked(api.search).mockResolvedValueOnce(createSearchPage(page1, { page: 1, pageSize: 8, total: 13 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.actions.setSearchKeyword('ai');
    });

    await waitFor(() => {
      expect(result.current.state.searchResults).toHaveLength(8);
    });

    expect(api.search).toHaveBeenCalledWith('ai', { page: 1, pageSize: 8 });
    expect(result.current.state.searchPage).toBe(1);
    expect(result.current.state.searchHasMore).toBe(true);
  });

  it('appends search results when loading more', async () => {
    const page1 = Array.from({ length: 8 }, (_, i) => createMockPost({ id: `post-${i}` }));
    const page2 = Array.from({ length: 5 }, (_, i) => createMockPost({ id: `post-${8 + i}` }));

    vi.mocked(api.search)
      .mockResolvedValueOnce(createSearchPage(page1, { page: 1, pageSize: 8, total: 13 }))
      .mockResolvedValueOnce(createSearchPage(page2, { page: 2, pageSize: 8, total: 13 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.actions.setSearchKeyword('ai');
    });

    await waitFor(() => {
      expect(result.current.state.searchResults).toHaveLength(8);
    });

    await act(async () => {
      await result.current.actions.loadMoreSearchResults();
    });

    expect(api.search).toHaveBeenNthCalledWith(2, 'ai', { page: 2, pageSize: 8 });
    expect(result.current.state.searchResults).toHaveLength(13);
    expect(result.current.state.searchPage).toBe(2);
    expect(result.current.state.searchHasMore).toBe(false);
  });

  it('does not load more when search has no more pages', async () => {
    const page1 = [createMockPost({ id: 'post-1' })];
    vi.mocked(api.search).mockResolvedValueOnce(createSearchPage(page1, { page: 1, pageSize: 8, total: 1 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.actions.setSearchKeyword('ai');
    });

    await waitFor(() => {
      expect(result.current.state.searchResults).toHaveLength(1);
    });

    await act(async () => {
      await result.current.actions.loadMoreSearchResults();
    });

    expect(api.search).toHaveBeenCalledTimes(1);
    expect(result.current.state.searchHasMore).toBe(false);
  });

  it('sets message when load more search fails', async () => {
    vi.mocked(api.search)
      .mockResolvedValueOnce(createSearchPage([createMockPost({ id: 'post-1' })], { page: 1, pageSize: 8, total: 9 }))
      .mockRejectedValueOnce(new Error('search load failed'));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.actions.setSearchKeyword('ai');
    });

    await waitFor(() => {
      expect(result.current.state.searchResults).toHaveLength(1);
    });

    await act(async () => {
      await result.current.actions.loadMoreSearchResults();
    });

    expect(result.current.state.message).toBe('search load failed');
    expect(result.current.state.searchPage).toBe(1);
  });

  it('clears search results when keyword is empty', async () => {
    vi.mocked(api.search).mockResolvedValueOnce(createSearchPage([createMockPost({ id: 'post-1' })], { page: 1, pageSize: 8, total: 1 }));

    const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.actions.setSearchKeyword('ai');
    });

    await waitFor(() => {
      expect(result.current.state.searchResults).toHaveLength(1);
    });

    await act(async () => {
      result.current.actions.setSearchKeyword('');
    });

    expect(result.current.state.searchResults).toHaveLength(0);
    expect(result.current.state.searchPage).toBe(1);
    expect(result.current.state.searchHasMore).toBe(true);
  });
});
