import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FilterTabs } from './FilterTabs';
import type { Notification } from '../../types/app';

describe('FilterTabs', () => {
  const createNotification = (type: Notification['type'], isRead: boolean): Notification => ({
    id: `test-${type}-${isRead}`,
    type,
    isRead,
    actorId: 'actor-1',
    actor: { id: 'actor-1', nickname: 'Test User', username: 'testuser', avatarUrl: null },
    entityType: 'post',
    entityId: 'post-1',
    message: 'liked your post',
    createdAt: new Date().toISOString(),
  });

  const mockNotifications: Notification[] = [
    createNotification('like', false),
    createNotification('like', false),
    createNotification('comment', false),
    createNotification('follow', true),
    createNotification('favorite', false),
    createNotification('favorite', false),
    createNotification('favorite', true),
  ];

  describe('rendering', () => {
    it('should render all filter tabs', () => {
      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={mockNotifications} />);

      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('点赞')).toBeInTheDocument();
      expect(screen.getByText('评论')).toBeInTheDocument();
      expect(screen.getByText('关注')).toBeInTheDocument();
      expect(screen.getByText('收藏')).toBeInTheDocument();
    });

    it('should display unread count badges for each tab', () => {
      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={mockNotifications} />);

      // 全部：5 个未读
      const allTab = screen.getByText('全部').closest('button');
      expect(allTab).toHaveTextContent('5');

      // 点赞：2 个未读
      const likeTab = screen.getByText('点赞').closest('button');
      expect(likeTab).toHaveTextContent('2');

      // 评论：1 个未读
      const commentTab = screen.getByText('评论').closest('button');
      expect(commentTab).toHaveTextContent('1');

      // 关注：0 个未读（不显示角标）
      const followTab = screen.getByText('关注').closest('button');
      expect(followTab).not.toHaveTextContent('0');

      // 收藏：2 个未读
      const favoriteTab = screen.getByText('收藏').closest('button');
      expect(favoriteTab).toHaveTextContent('2');
    });

    it('should highlight the active filter tab', () => {
      const { rerender } = render(
        <FilterTabs activeFilter="all" onChange={vi.fn()} notifications={mockNotifications} />
      );

      const allTab = screen.getByText('全部').closest('button');
      expect(allTab).toHaveClass('active');

      rerender(<FilterTabs activeFilter="like" onChange={vi.fn()} notifications={mockNotifications} />);

      const likeTab = screen.getByText('点赞').closest('button');
      expect(likeTab).toHaveClass('active');
    });

    it('should not show badge when unread count is 0', () => {
      const readNotifications: Notification[] = [
        createNotification('follow', true),
        createNotification('follow', true),
      ];

      render(<FilterTabs activeFilter="follow" onChange={vi.fn()} notifications={readNotifications} />);

      const followTab = screen.getByText('关注').closest('button');
      expect(followTab).not.toHaveTextContent('0');
    });

    it('should cap badge count at 99', () => {
      const manyNotifications: Notification[] = Array(150)
        .fill(null)
        .map(() => createNotification('like', false));

      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={manyNotifications} />);

      const allTab = screen.getByText('全部').closest('button');
      expect(allTab).toHaveTextContent('99');
    });
  });

  describe('interactions', () => {
    it('should call onChange when clicking a tab', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <FilterTabs activeFilter="all" onChange={handleChange} notifications={mockNotifications} />
      );

      await user.click(screen.getByText('点赞'));
      expect(handleChange).toHaveBeenCalledWith('like');

      await user.click(screen.getByText('评论'));
      expect(handleChange).toHaveBeenCalledWith('comment');
    });

    it('should update active state after clicking', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      const { rerender } = render(
        <FilterTabs activeFilter="all" onChange={handleChange} notifications={mockNotifications} />
      );

      await user.click(screen.getByText('点赞'));

      // 模拟父组件更新 activeFilter
      rerender(
        <FilterTabs activeFilter="like" onChange={handleChange} notifications={mockNotifications} />
      );

      expect(screen.getByText('点赞').closest('button')).toHaveClass('active');
      expect(screen.getByText('全部').closest('button')).not.toHaveClass('active');
    });
  });

  describe('accessibility', () => {
    it('should use button elements for tabs', () => {
      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={mockNotifications} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);

      buttons.forEach((button) => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have proper class names for styling', () => {
      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={mockNotifications} />);

      const container = document.querySelector('.filter-tabs');
      expect(container).toBeInTheDocument();

      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('filter-tab');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty notifications list', () => {
      render(<FilterTabs activeFilter="all" onChange={vi.fn()} notifications={[]} />);

      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('点赞')).toBeInTheDocument();

      // 所有标签都不应该显示数字
      const tabs = screen.getAllByRole('button');
      tabs.forEach((tab) => {
        expect(tab).not.toHaveTextContent(/\d+/);
      });
    });

    it('should handle notifications with missing actor data', () => {
      const incompleteNotifications: Notification[] = [
        {
          id: 'test-1',
          type: 'like',
          isRead: false,
          actorId: 'actor-1',
          actor: { id: 'actor-1', nickname: '', username: '', avatarUrl: null },
          entityType: 'post',
          entityId: 'post-1',
          message: 'liked your post',
          createdAt: new Date().toISOString(),
        },
      ];

      render(
        <FilterTabs
          activeFilter="all"
          onChange={vi.fn()}
          notifications={incompleteNotifications}
        />
      );

      expect(screen.getByText('全部')).toBeInTheDocument();
      expect(screen.getByText('点赞').closest('button')).toHaveTextContent('1');
    });
  });
});
