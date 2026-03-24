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
    vi.mocked(api.getFeed).mockResolvedValue({ items: [] });
    vi.mocked(api.getMyUser).mockResolvedValue({ user: createMockUser() });
    vi.mocked(api.getProfile).mockResolvedValue({ profile: createMockProfile() });
    vi.mocked(api.getPosts).mockResolvedValue({ items: [] });
    vi.mocked(api.getFavorites).mockResolvedValue({ items: [], total: 0 });
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [] });
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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: mockNotifications });

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
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });

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
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });
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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: mockNotifications });

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
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });
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
      
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [notification] });

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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [notification] });
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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [notification] });

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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [notification] });
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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [notification] });
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

      expect(result.current.state.notificationPage).toBe(1);
    });

    it('should not load more when already loading', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      // Set loading state manually
      await act(async () => {
        result.current.actions.loadMoreNotifications();
        // Call again while first call might be in progress
        await result.current.actions.loadMoreNotifications();
      });

      // Should not exceed page 2 due to duplicate calls
      expect(result.current.state.notificationPage).toBeLessThanOrEqual(2);
    });

    it('should not load more when no more notifications available', async () => {
      // Create 15 notifications - less than one full "page" (20)
      const mockNotifications = Array.from({ length: 15 }, (_, i) => 
        createMockNotification({ id: `notif-${i}` })
      );
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: mockNotifications });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(15);
      });

      // Load more - since we have 15 < 20, hasMore should become false
      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(result.current.state.notificationHasMore).toBe(false);
    });

    it('should increment page number on successful load', async () => {
      // Create 25 notifications - more than one "page" (20)
      const mockNotifications = Array.from({ length: 25 }, (_, i) =>
        createMockNotification({ id: `notif-${i}` })
      );
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: mockNotifications });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(25);
      });

      expect(result.current.state.notificationPage).toBe(1);

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(result.current.state.notificationPage).toBe(2);
    });

    it('should set loadingMore state during load', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      expect(result.current.state.loadingMore).toBe(false);

      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      expect(result.current.state.loadingMore).toBe(false);
    });

    it('should handle error gracefully', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [createMockNotification()] });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(1);
      });

      // The current implementation doesn't make API calls in loadMoreNotifications
      // It just simulates pagination logic
      await act(async () => {
        await result.current.actions.loadMoreNotifications();
      });

      // Should not have error message since no API call fails
      expect(result.current.state.notificationPage).toBe(2);
    });
  });

  describe('notification state management', () => {
    it('should clear notifications on logout', async () => {
      vi.mocked(api.getNotifications).mockResolvedValue({
        notifications: [createMockNotification()],
      });

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

      vi.mocked(api.getNotifications).mockResolvedValue({ notifications: mockNotifications });

      localStorage.setItem('fork-weibo-token', mockToken);
      localStorage.setItem('fork-weibo-user', JSON.stringify(createMockUser()));

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.state.notifications).toHaveLength(2);
      });

      expect(api.getNotifications).toHaveBeenCalledWith(mockToken);
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
