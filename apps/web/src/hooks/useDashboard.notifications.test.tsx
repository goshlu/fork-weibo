import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDashboard } from './useDashboard';
import { I18nProvider } from '../i18n';
import type { Notification, User, UserProfile, Post } from '../types/app';

// Mock the api module
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
    getComment: vi.fn(),
    getPost: vi.fn(),
    getComments: vi.fn(),
  },
}));

import { api } from '../services/api';

// Helper to create mock notification
function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    actorId: 'actor-1',
    actor: {
      id: 'actor-1',
      nickname: 'Test Actor',
      username: 'testactor',
      avatarUrl: null,
    },
    type: 'like',
    entityId: 'entity-1',
    entityType: 'post',
    message: 'Test notification message',
    isRead: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock user
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    username: 'testuser',
    nickname: 'Test User',
    bio: 'Test bio',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper to create mock profile
function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    username: 'testuser',
    nickname: 'Test User',
    bio: 'Test bio',
    avatarUrl: null,
    stats: {
      followers: 0,
      following: 0,
      posts: 0,
      likesReceived: 0,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createNotificationPage(
  notifications: Notification[],
  options: { page?: number; pageSize?: number; total?: number; hasMore?: boolean } = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? 20;
  const total = options.total ?? notifications.length;
  const hasMore = options.hasMore ?? page * pageSize < total;

  return {
    items: notifications,
    page,
    pageSize,
    total,
    hasMore,
  };
}

// Wrapper component with I18nProvider
function createWrapper() {
  return ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );
}

describe('useDashboard - notification actions', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(api.getTopics).mockResolvedValue({ items: [] });
    vi.mocked(api.getSearchTrends).mockResolvedValue({ items: [] });
    vi.mocked(api.getChannels).mockResolvedValue({ items: [] });
    vi.mocked(api.getFeed).mockResolvedValue({ items: [], page: 1, pageSize: 10, total: 0 });
    vi.mocked(api.getMyUser).mockResolvedValue({ user: createMockUser() });
    vi.mocked(api.getProfile).mockResolvedValue({ profile: createMockProfile() });
    vi.mocked(api.getPosts).mockResolvedValue({ items: [] });
    vi.mocked(api.getFavorites).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([]));
    vi.mocked(api.markNotificationsRead).mockResolvedValue(undefined);
    vi.mocked(api.markNotificationRead).mockResolvedValue(undefined);
    vi.mocked(api.getComment).mockResolvedValue({
      comment: {
        id: 'comment-1',
        postId: 'post-1',
        authorId: 'user-1',
        parentId: null,
        content: 'Test comment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    vi.mocked(api.getPost).mockResolvedValue({
      post: {
        id: 'post-1',
        authorId: 'user-1',
        content: 'Test post',
        status: 'published',
        createdAt: new Date().toISOString(),
      } as Post,
    });
    vi.mocked(api.getComments).mockResolvedValue({ comments: [] });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('markNotificationsRead', () => {
    it('should mark all notifications as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false, type: 'comment' }),
        createMockNotification({ id: 'notif-3', isRead: false, type: 'follow' }),
      ];

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage(mockNotifications));

      // Set token in localStorage before rendering
      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(3);
      });

      // Verify initial state has unread notifications
      expect(result.current.state.notifications.every((n) => !n.isRead)).toBe(true);

      // Call markNotificationsRead
      await act(async () => {
        await result.current.actions.markNotificationsRead();
      });

      // Verify API was called
      expect(api.markNotificationsRead).toHaveBeenCalledWith(mockToken);

      // Verify all notifications are now marked as read
      expect(result.current.state.notifications.every((n) => n.isRead)).toBe(true);
    });

    it('should not call API when user is not authenticated', async () => {
      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.actions.markNotificationsRead();
      });

      expect(api.markNotificationsRead).not.toHaveBeenCalled();
      expect(result.current.state.message).toBe('Log in before posting.');
    });

    it('should set busy state while marking notifications as read', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([createMockNotification()]));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      expect(result.current.state.busy).toBe('');

      // Start marking as read
      await act(async () => {
        await result.current.actions.markNotificationsRead();
      });

      // After completion, busy should be cleared
      expect(result.current.state.busy).toBe('');
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([createMockNotification()]));
      vi.mocked(api.markNotificationsRead).mockRejectedValue(new Error('Network error'));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.markNotificationsRead();
      });

      expect(result.current.state.message).toBe('Network error');
      // Notifications should remain unchanged
      expect(result.current.state.notifications[0].isRead).toBe(false);
    });
  });

  describe('markOneNotificationRead', () => {
    it('should mark a single notification as read', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1', isRead: false }),
        createMockNotification({ id: 'notif-2', isRead: false }),
      ];

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage(mockNotifications));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(2);
      });

      // Mark only the first notification as read
      await act(async () => {
        await result.current.actions.markOneNotificationRead('notif-1');
      });

      expect(api.markNotificationRead).toHaveBeenCalledWith('notif-1', mockToken);
      
      // Verify only the first notification is marked as read
      const notif1 = result.current.state.notifications.find((n) => n.id === 'notif-1');
      const notif2 = result.current.state.notifications.find((n) => n.id === 'notif-2');
      
      expect(notif1?.isRead).toBe(true);
      expect(notif2?.isRead).toBe(false);
    });

    it('should not call API when user is not authenticated', async () => {
      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.actions.markOneNotificationRead('notif-1');
      });

      expect(api.markNotificationRead).not.toHaveBeenCalled();
      expect(result.current.state.message).toBe('Log in before posting.');
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([createMockNotification()]));
      vi.mocked(api.markNotificationRead).mockRejectedValue(new Error('Failed to mark'));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.markOneNotificationRead('notif-1');
      });

      expect(result.current.state.message).toBe('Failed to mark');
    });
  });

  describe('openNotification', () => {
    it('should mark notification as read optimistically', async () => {
      const notification = createMockNotification({ id: 'notif-1', isRead: false });
      
      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([notification]));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.openNotification(notification);
      });

      // Notification should be marked as read in state
      expect(result.current.state.notifications[0].isRead).toBe(true);
    });

    it('should open user profile for user entity type', async () => {
      const notification = createMockNotification({
        id: 'notif-1',
        entityType: 'user',
        entityId: 'user-2',
        type: 'follow',
      });

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([notification]));
      vi.mocked(api.getProfile).mockResolvedValue({ profile: createMockProfile({ id: 'user-2' }) });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.openNotification(notification);
      });

      expect(api.getProfile).toHaveBeenCalledWith('user-2');
      expect(result.current.state.viewMode).toBe('user');
      expect(result.current.state.viewedUserId).toBe('user-2');
    });

    it('should open post detail for post entity type', async () => {
      const notification = createMockNotification({
        id: 'notif-1',
        entityType: 'post',
        entityId: 'post-1',
        type: 'like',
      });

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([notification]));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.openNotification(notification);
      });

      expect(api.getPost).toHaveBeenCalledWith('post-1', mockToken);
      expect(result.current.state.viewMode).toBe('post');
    });

    it('should open post with highlighted comment for comment entity type', async () => {
      const notification = createMockNotification({
        id: 'notif-1',
        entityType: 'comment',
        entityId: 'comment-1',
        type: 'comment',
      });

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([notification]));
      vi.mocked(api.getComment).mockResolvedValue({
        comment: {
          id: 'comment-1',
          postId: 'post-1',
          authorId: 'user-2',
          parentId: null,
          content: 'Test comment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.openNotification(notification);
      });

      expect(api.getComment).toHaveBeenCalledWith('comment-1');
      expect(result.current.state.viewMode).toBe('post');
      expect(result.current.state.postDetailHighlightCommentId).toBe('comment-1');
    });

    it('should handle error gracefully', async () => {
      const notification = createMockNotification({
        id: 'notif-1',
        entityType: 'post',
        entityId: 'post-1',
      });

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([notification]));
      vi.mocked(api.getPost).mockRejectedValue(new Error('Post not found'));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.openNotification(notification);
      });

      expect(result.current.state.message).toBe('Post not found');
    });
  });

  describe('loadMoreNotifications', () => {
    it('should not load more when not authenticated', async () => {
      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(api.getNotifications).not.toHaveBeenCalled();
      expect(result.current.state.notificationPage).toBe(1);
    });

    it('should append notifications from the next page', async () => {
      const firstPageItems = Array.from({ length: 20 }, (_, i) =>
        createMockNotification({ id: `notif-${i}` }),
      );
      const secondPageItems = Array.from({ length: 5 }, (_, i) =>
        createMockNotification({ id: `notif-${20 + i}` }),
      );
      vi.mocked(api.getNotifications)
        .mockResolvedValueOnce(createNotificationPage(firstPageItems, { page: 1, pageSize: 20, total: 25, hasMore: true }))
        .mockResolvedValueOnce(createNotificationPage(secondPageItems, { page: 2, pageSize: 20, total: 25, hasMore: false }));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(20);
      });

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(api.getNotifications).toHaveBeenNthCalledWith(1, mockToken, { page: 1, pageSize: 20 });
      expect(api.getNotifications).toHaveBeenNthCalledWith(2, mockToken, { page: 2, pageSize: 20 });
      expect(result.current.state.notifications).toHaveLength(25);
      expect(result.current.state.notificationPage).toBe(2);
      expect(result.current.state.notificationHasMore).toBe(false);
    });

    it('should not load more when no more notifications available', async () => {
      const mockNotifications = Array.from({ length: 15 }, (_, i) =>
        createMockNotification({ id: `notif-${i}` })
      );
      vi.mocked(api.getNotifications).mockResolvedValue(
        createNotificationPage(mockNotifications, { page: 1, pageSize: 20, total: 15, hasMore: false }),
      );

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(15);
      });

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(api.getNotifications).toHaveBeenCalledTimes(1);
      expect(result.current.state.notificationHasMore).toBe(false);
    });

    it('should set loadingMore state during request', async () => {
      const firstPage = [createMockNotification({ id: 'notif-1' })];
      let resolveNextPage: ((value: ReturnType<typeof createNotificationPage>) => void) | undefined;
      const nextPagePromise = new Promise<ReturnType<typeof createNotificationPage>>((resolve) => {
        resolveNextPage = resolve;
      });

      vi.mocked(api.getNotifications)
        .mockResolvedValueOnce(createNotificationPage(firstPage, { page: 1, pageSize: 20, total: 21, hasMore: true }))
        .mockImplementationOnce(() => nextPagePromise);

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      act(() => {
        void result.current.actions.loadMoreNotifications();
      });

      expect(result.current.state.loadingMore).toBe(true);

      await act(async () => {
        resolveNextPage?.(
          createNotificationPage([createMockNotification({ id: 'notif-2' })], { page: 2, pageSize: 20, total: 21, hasMore: false }),
        );
        await nextPagePromise;
      });

      expect(result.current.state.loadingMore).toBe(false);
    });

    it('should handle error gracefully', async () => {
      vi.mocked(api.getNotifications)
        .mockResolvedValueOnce(createNotificationPage([createMockNotification()], { page: 1, pageSize: 20, total: 21, hasMore: true }))
        .mockRejectedValueOnce(new Error('load more failed'));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(result.current.state.message).toBe('load more failed');
      expect(result.current.state.notificationPage).toBe(1);
    });
  });

  describe('notification state management', () => {
    it('should clear notifications on logout', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage([createMockNotification()]));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      await act(async () => {
        result.current.actions.logout();
      });

      expect(result.current.state.notifications).toHaveLength(0);
      expect(result.current.state.token).toBe('');
    });

    it('should load notifications on authentication', async () => {
      const mockNotifications = [
        createMockNotification({ id: 'notif-1' }),
        createMockNotification({ id: 'notif-2', type: 'comment' }),
      ];

      vi.mocked(api.getNotifications).mockResolvedValue(createNotificationPage(mockNotifications));

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(2);
      });

      expect(api.getNotifications).toHaveBeenCalledWith(mockToken, { page: 1, pageSize: 20 });
    });

    it('should initialize with empty notifications', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      expect(result.current.state.notifications).toEqual([]);
      expect(result.current.state.notificationPage).toBe(1);
      expect(result.current.state.notificationHasMore).toBe(true);
      expect(result.current.state.loadingMore).toBe(false);
    });
  });
});
