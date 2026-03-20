import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { NotificationCard } from './NotificationCard';
import type { Notification } from '../../types/app';

describe('NotificationCard', () => {
  const createNotification = (
    type: Notification['type'],
    isRead: boolean,
    hasAvatar = false
  ): Notification => ({
    id: `test-${type}-${isRead}`,
    type,
    isRead,
    actorId: 'actor-1',
    actor: {
      id: 'actor-1',
      nickname: 'Test User',
      username: 'testuser',
      avatarUrl: hasAvatar ? '/avatars/test.jpg' : null,
    },
    entityType: 'post',
    entityId: 'post-1',
    message: 'liked your post',
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  });

  describe('rendering', () => {
    it('should render notification card with basic information', () => {
      const notification = createNotification('like', false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('Likes')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('@testuser')).toBeInTheDocument();
      expect(screen.getByText(/liked your post/i)).toBeInTheDocument();
    });

    it('should display unread indicator for unread notifications', () => {
      const unreadNotification = createNotification('like', false);
      const { rerender } = render(
        <NotificationCard notification={unreadNotification} />
      );

      expect(screen.getByLabelText('未读')).toBeInTheDocument();
      expect(screen.getByRole('button')).not.toHaveClass('read');

      rerender(<NotificationCard notification={createNotification('like', true)} />);

      expect(screen.queryByLabelText('未读')).not.toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('read');
    });

    it('should show avatar image when available', () => {
      const notification = createNotification('comment', false, true);
      render(<NotificationCard notification={notification} />);

      const avatarImage = screen.getByAltText('Test User');
      expect(avatarImage).toHaveAttribute('src', expect.stringContaining('/avatars/test.jpg'));
    });

    it('should show initial letter when no avatar', () => {
      const notification = createNotification('follow', false, false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('T')).toBeInTheDocument();
    });

    it('should apply correct CSS classes', () => {
      const notification = createNotification('favorite', false);
      const { container } = render(<NotificationCard notification={notification} />);

      expect(container.querySelector('.notification-page-card-wrapper')).toBeInTheDocument();
      expect(container.querySelector('.notification-page-card')).toBeInTheDocument();
      expect(container.querySelector('.notification-actor-avatar')).toBeInTheDocument();
      expect(container.querySelector('.notification-copy')).toBeInTheDocument();
    });
  });

  describe('mark as read functionality', () => {
    it('should show mark as read button for unread notifications', () => {
      const unreadNotification = createNotification('like', false);
      const handleMarkRead = vi.fn();

      render(<NotificationCard notification={unreadNotification} onMarkRead={handleMarkRead} />);

      const markReadButton = screen.getByTitle('Mark as read');
      expect(markReadButton).toBeInTheDocument();
      expect(markReadButton).toHaveTextContent('✓');
    });

    it('should not show mark as read button for read notifications', () => {
      const readNotification = createNotification('like', true);
      const handleMarkRead = vi.fn();

      render(<NotificationCard notification={readNotification} onMarkRead={handleMarkRead} />);

      expect(screen.queryByTitle('Mark as read')).not.toBeInTheDocument();
    });

    it('should not show mark as read button when onMarkRead is not provided', () => {
      const unreadNotification = createNotification('like', false);

      render(<NotificationCard notification={unreadNotification} />);

      expect(screen.queryByTitle('Mark as read')).not.toBeInTheDocument();
    });

    it('should call onMarkRead when clicking the button', async () => {
      const user = userEvent.setup();
      const unreadNotification = createNotification('like', false);
      const handleMarkRead = vi.fn();

      render(
        <NotificationCard
          notification={unreadNotification}
          onMarkRead={handleMarkRead}
        />
      );

      await user.click(screen.getByTitle('Mark as read'));

      expect(handleMarkRead).toHaveBeenCalledWith('test-like-false');
      expect(handleMarkRead).toHaveBeenCalledTimes(1);
    });

    it('should not trigger card click when clicking mark as read button', async () => {
      const user = userEvent.setup();
      const unreadNotification = createNotification('like', false);
      const handleMarkRead = vi.fn();
      const handleClick = vi.fn();

      render(
        <NotificationCard
          notification={unreadNotification}
          onMarkRead={handleMarkRead}
          onClick={handleClick}
        />
      );

      await user.click(screen.getByTitle('Mark as read'));

      expect(handleMarkRead).toHaveBeenCalled();
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('click interactions', () => {
    it('should call onClick when clicking the card', async () => {
      const user = userEvent.setup();
      const notification = createNotification('like', false);
      const handleClick = vi.fn();

      render(<NotificationCard notification={notification} onClick={handleClick} />);

      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledWith(notification);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should work without onClick handler', async () => {
      const user = userEvent.setup();
      const notification = createNotification('comment', true);

      render(<NotificationCard notification={notification} />);

      await user.click(screen.getByRole('button'));

      // Should not throw any errors
      expect(true).toBe(true);
    });
  });

  describe('different notification types', () => {
    it('should render like notification correctly', () => {
      const notification = createNotification('like', false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('Likes')).toBeInTheDocument();
    });

    it('should render comment notification correctly', () => {
      const notification = createNotification('comment', false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('Replies')).toBeInTheDocument();
    });

    it('should render follow notification correctly', () => {
      const notification = createNotification('follow', false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('Follows')).toBeInTheDocument();
    });

    it('should render favorite notification correctly', () => {
      const notification = createNotification('favorite', false);
      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('Saves')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should use button element for interaction', () => {
      const notification = createNotification('like', false);
      render(<NotificationCard notification={notification} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have proper aria-label for unread indicator', () => {
      const unreadNotification = createNotification('like', false);
      render(<NotificationCard notification={unreadNotification} />);

      expect(screen.getByLabelText('未读')).toBeInTheDocument();
    });

    it('should have title attribute on mark as read button', () => {
      const unreadNotification = createNotification('like', false);
      render(<NotificationCard notification={unreadNotification} onMarkRead={vi.fn()} />);

      expect(screen.getByTitle('Mark as read')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle notification with missing actor data gracefully', () => {
      const incompleteNotification: Notification = {
        id: 'incomplete',
        type: 'like',
        isRead: false,
        actorId: 'actor-1',
        actor: null,
        entityType: 'post',
        entityId: 'post-1',
        message: 'liked your post',
        createdAt: new Date().toISOString(),
      };

      expect(() => {
        render(<NotificationCard notification={incompleteNotification} />);
      }).not.toThrow();

      expect(screen.getByText('Someone')).toBeInTheDocument();
    });

    it('should handle empty message', () => {
      const notification: Notification = {
        id: 'empty-message',
        type: 'like',
        isRead: false,
        actorId: 'actor-1',
        actor: { id: 'actor-1', nickname: 'User', username: 'user', avatarUrl: null },
        entityType: 'post',
        entityId: 'post-1',
        message: '',
        createdAt: new Date().toISOString(),
      };

      render(<NotificationCard notification={notification} />);

      expect(screen.getByText('You have a new notification.')).toBeInTheDocument();
    });

    it('should handle very long nickname', () => {
      const notification: Notification = {
        id: 'long-nickname',
        type: 'like',
        isRead: false,
        actorId: 'actor-1',
        actor: {
          id: 'actor-1',
          nickname: 'ThisIsAVeryLongNicknameThatShouldBeTruncatedInActualDisplay',
          username: 'user',
          avatarUrl: null,
        },
        entityType: 'post',
        entityId: 'post-1',
        message: 'liked your post',
        createdAt: new Date().toISOString(),
      };

      render(<NotificationCard notification={notification} />);

      expect(
        screen.getByText('ThisIsAVeryLongNicknameThatShouldBeTruncatedInActualDisplay')
      ).toBeInTheDocument();
    });
  });
});
