import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsPage } from './NotificationsPage';
import type { Notification } from '../../types/app';

// Helper to create mock notification
function createMockNotification(overrides: Partial<Notification> = {}): Notification {
  const now = new Date();
  return {
    id: `notif-${Math.random().toString(36).slice(2)}`,
    actorId: 'actor-1',
    actor: {
      id: 'actor-1',
      nickname: 'Test User',
      username: 'testuser',
      avatarUrl: null,
    },
    type: 'like',
    entityId: 'entity-1',
    entityType: 'post',
    message: 'liked your post',
    isRead: false,
    createdAt: now.toISOString(),
    ...overrides,
  };
}

// Mock IntersectionObserver as a constructor function
const MockIntersectionObserver = vi.fn(function MockIntersectionObserver() {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('NotificationsPage', () => {
  const defaultHandlers = {
    onMarkAllRead: vi.fn(),
    onMarkOneRead: vi.fn(),
    onOpenNotification: vi.fn(),
    onLoadMore: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render page title and mark all read button', () => {
      render(
        <NotificationsPage
          notifications={[]}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Notification Center')).toBeInTheDocument();
      expect(screen.getByText('All notifications')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument();
    });

    it('should render filter tabs', () => {
      render(
        <NotificationsPage
          notifications={[]}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: /全部/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /点赞/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /评论/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /关注/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /收藏/i })).toBeInTheDocument();
    });

    it('should render empty state when no notifications', () => {
      render(
        <NotificationsPage
          notifications={[]}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Inbox cleared.')).toBeInTheDocument();
      expect(screen.getByText(/New likes, follows, comments, and favorites will appear here/i)).toBeInTheDocument();
    });

    it('should render notification cards when notifications exist', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', message: 'liked your post' }),
        createMockNotification({ id: 'notif-2', type: 'comment', message: 'commented on your post' }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      // formatNotificationMessage transforms messages
      expect(screen.getByText(/Test User liked your post/i)).toBeInTheDocument();
      expect(screen.getByText(/Test User commented on your post/i)).toBeInTheDocument();
    });
  });

  describe('notification grouping', () => {
    it('should group notifications by date', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      const notifications = [
        createMockNotification({ id: 'today-1', createdAt: today.toISOString() }),
        createMockNotification({ id: 'yesterday-1', createdAt: yesterday.toISOString() }),
        createMockNotification({ id: 'older-1', createdAt: twoDaysAgo.toISOString() }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('今天')).toBeInTheDocument();
      expect(screen.getByText('昨天')).toBeInTheDocument();
      expect(screen.getByText('更早')).toBeInTheDocument();
    });

    it('should not show empty groups', () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const notifications = [
        createMockNotification({ id: 'today-1', createdAt: today.toISOString() }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('今天')).toBeInTheDocument();
      expect(screen.queryByText('昨天')).not.toBeInTheDocument();
      expect(screen.queryByText('更早')).not.toBeInTheDocument();
    });
  });

  describe('filtering', () => {
    it('should filter notifications by type', async () => {
      const user = userEvent.setup();
      const notifications = [
        createMockNotification({ id: 'notif-1', type: 'like', isRead: false }),
        createMockNotification({ id: 'notif-2', type: 'comment', isRead: false }),
        createMockNotification({ id: 'notif-3', type: 'follow', isRead: false }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      // Initially all 3 unread notifications have mark read buttons
      expect(screen.getAllByTitle('Mark as read')).toHaveLength(3);

      // Click on "点赞" filter
      await user.click(screen.getByRole('button', { name: /点赞/i }));

      // Only like notification should be visible
      expect(screen.getAllByTitle('Mark as read')).toHaveLength(1);
    });

    it('should show unread count badges on filter tabs', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', type: 'like', isRead: false }),
        createMockNotification({ id: 'notif-2', type: 'like', isRead: true }),
        createMockNotification({ id: 'notif-3', type: 'comment', isRead: false }),
        createMockNotification({ id: 'notif-4', type: 'follow', isRead: false }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      // "全部" tab should show total unread count (3)
      const allTab = screen.getByRole('button', { name: /全部/i });
      expect(allTab.querySelector('.filter-tab-badge')).toHaveTextContent('3');

      // "点赞" tab should show like unread count (1)
      const likeTab = screen.getByRole('button', { name: /点赞/i });
      expect(likeTab.querySelector('.filter-tab-badge')).toHaveTextContent('1');
    });

    it('should show "all" filter by default', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', type: 'like' }),
        createMockNotification({ id: 'notif-2', type: 'comment' }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      const allTab = screen.getByRole('button', { name: /全部/i });
      expect(allTab).toHaveClass('active');
    });
  });

  describe('mark as read functionality', () => {
    it('should call onMarkAllRead when clicking mark all read button', async () => {
      const user = userEvent.setup();
      const onMarkAllRead = vi.fn();

      render(
        <NotificationsPage
          notifications={[createMockNotification()]}
          onMarkAllRead={onMarkAllRead}
          onMarkOneRead={defaultHandlers.onMarkOneRead}
          onOpenNotification={defaultHandlers.onOpenNotification}
        />
      );

      await user.click(screen.getByRole('button', { name: /mark all read/i }));

      expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    });

    it('should call onMarkOneRead when clicking mark read button on card', async () => {
      const user = userEvent.setup();
      const onMarkOneRead = vi.fn();
      const notification = createMockNotification({ id: 'notif-1', isRead: false });

      render(
        <NotificationsPage
          notifications={[notification]}
          onMarkAllRead={defaultHandlers.onMarkAllRead}
          onMarkOneRead={onMarkOneRead}
          onOpenNotification={defaultHandlers.onOpenNotification}
        />
      );

      await user.click(screen.getByTitle('Mark as read'));

      expect(onMarkOneRead).toHaveBeenCalledWith('notif-1');
    });

    it('should not show mark read button for read notifications', () => {
      const notification = createMockNotification({ id: 'notif-1', isRead: true });

      render(
        <NotificationsPage
          notifications={[notification]}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByTitle('Mark as read')).not.toBeInTheDocument();
    });
  });

  describe('notification click', () => {
    it('should call onOpenNotification when clicking a notification card', async () => {
      const user = userEvent.setup();
      const onOpenNotification = vi.fn();
      const notification = createMockNotification({ id: 'notif-1', message: 'liked your post' });

      render(
        <NotificationsPage
          notifications={[notification]}
          onMarkAllRead={defaultHandlers.onMarkAllRead}
          onMarkOneRead={defaultHandlers.onMarkOneRead}
          onOpenNotification={onOpenNotification}
        />
      );

      // Click on the notification card (not the mark read button)
      // The card contains the formatted message
      const cardButton = screen.getByText(/Test User liked your post/i).closest('button');
      if (cardButton) {
        await user.click(cardButton);
      }

      expect(onOpenNotification).toHaveBeenCalledWith(notification);
    });
  });

  describe('infinite scroll', () => {
    it('should show loading indicator when loading more', () => {
      render(
        <NotificationsPage
          notifications={[createMockNotification()]}
          {...defaultHandlers}
          hasMore={true}
          loadingMore={true}
        />
      );

      expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });

    it('should show "no more" message when all loaded', () => {
      render(
        <NotificationsPage
          notifications={[createMockNotification()]}
          {...defaultHandlers}
          hasMore={false}
          loadingMore={false}
        />
      );

      expect(screen.getByText('No more notifications')).toBeInTheDocument();
    });

    it('should not show "no more" message when no notifications', () => {
      render(
        <NotificationsPage
          notifications={[]}
          {...defaultHandlers}
          hasMore={false}
          loadingMore={false}
        />
      );

      expect(screen.queryByText('No more notifications')).not.toBeInTheDocument();
    });

    it('should setup intersection observer for infinite scroll', () => {
      render(
        <NotificationsPage
          notifications={[createMockNotification()]}
          {...defaultHandlers}
          hasMore={true}
          loadingMore={false}
        />
      );

      expect(MockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user flow: filter, mark read, navigate', async () => {
      const user = userEvent.setup();
      const onMarkOneRead = vi.fn();
      const onOpenNotification = vi.fn();

      const notifications = [
        createMockNotification({ id: 'notif-1', type: 'like', isRead: false, message: 'liked your post' }),
        createMockNotification({ id: 'notif-2', type: 'comment', isRead: false, message: 'commented on your post' }),
        createMockNotification({ id: 'notif-3', type: 'like', isRead: true, message: 'liked your post' }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          onMarkAllRead={defaultHandlers.onMarkAllRead}
          onMarkOneRead={onMarkOneRead}
          onOpenNotification={onOpenNotification}
        />
      );

      // Verify all notifications visible initially (formatNotificationMessage transforms messages)
      // Note: Two notifications have "Test User liked your post." message (one read, one unread)
      const likedPostMessages = screen.getAllByText(/Test User liked your post/i);
      expect(likedPostMessages).toHaveLength(2);
      expect(screen.getByText(/Test User commented on your post/i)).toBeInTheDocument();

      // Filter to show only likes
      await user.click(screen.getByRole('button', { name: /点赞/i }));

      // Only like notifications should be visible (still 2 like notifications)
      const likeMessagesAfterFilter = screen.getAllByText(/Test User liked your post/i);
      expect(likeMessagesAfterFilter).toHaveLength(2);
      expect(screen.queryByText(/Test User commented on your post/i)).not.toBeInTheDocument();

      // Mark one as read
      const markReadButtons = screen.getAllByTitle('Mark as read');
      await user.click(markReadButtons[0]);

      expect(onMarkOneRead).toHaveBeenCalledWith('notif-1');
    });

    it('should update filter badges when notifications change', () => {
      const { rerender } = render(
        <NotificationsPage
          notifications={[
            createMockNotification({ id: 'notif-1', type: 'like', isRead: false }),
          ]}
          {...defaultHandlers}
        />
      );

      // Initial badge count
      const likeTab = screen.getByRole('button', { name: /点赞/i });
      expect(likeTab.querySelector('.filter-tab-badge')).toHaveTextContent('1');

      // Update with more unread notifications
      rerender(
        <NotificationsPage
          notifications={[
            createMockNotification({ id: 'notif-1', type: 'like', isRead: false }),
            createMockNotification({ id: 'notif-2', type: 'like', isRead: false }),
          ]}
          {...defaultHandlers}
        />
      );

      // Badge should update
      expect(likeTab.querySelector('.filter-tab-badge')).toHaveTextContent('2');
    });

    it('should handle mixed notification types correctly', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', type: 'like', isRead: false }),
        createMockNotification({ id: 'notif-2', type: 'comment', isRead: false }),
        createMockNotification({ id: 'notif-3', type: 'follow', isRead: false }),
        createMockNotification({ id: 'notif-4', type: 'favorite', isRead: false }),
      ];

      render(
        <NotificationsPage
          notifications={notifications}
          {...defaultHandlers}
        />
      );

      // All type tabs should have badges
      expect(screen.getByRole('button', { name: /点赞/i }).querySelector('.filter-tab-badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /评论/i }).querySelector('.filter-tab-badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /关注/i }).querySelector('.filter-tab-badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /收藏/i }).querySelector('.filter-tab-badge')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper button types', () => {
      render(
        <NotificationsPage
          notifications={[createMockNotification()]}
          {...defaultHandlers}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have accessible unread indicators', () => {
      const notification = createMockNotification({ isRead: false });

      render(
        <NotificationsPage
          notifications={[notification]}
          {...defaultHandlers}
        />
      );

      expect(screen.getByLabelText('未读')).toBeInTheDocument();
    });
  });
});
