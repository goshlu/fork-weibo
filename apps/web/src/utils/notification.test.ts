import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatNotificationTime,
  notificationTypeLabel,
  notificationActorLabel,
  notificationActorHandle,
  notificationActorInitial,
  formatNotificationMessage,
} from './notification';
import type { Notification } from '../types/app';

describe('notification utils', () => {
  describe('formatNotificationTime', () => {
    beforeEach(() => {
      // 固定当前时间用于测试
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for notifications created less than a minute ago', () => {
      const time = new Date('2024-01-01T11:59:30Z').toISOString();
      expect(formatNotificationTime(time)).toBe('just now');
    });

    it('should return minutes ago for notifications created less than an hour ago', () => {
      const time = new Date('2024-01-01T11:30:00Z').toISOString();
      expect(formatNotificationTime(time)).toBe('30m ago');
    });

    it('should return hours ago for notifications created less than a day ago', () => {
      const time = new Date('2024-01-01T08:00:00Z').toISOString();
      expect(formatNotificationTime(time)).toBe('4h ago');
    });

    it('should return "昨天 HH:mm" for notifications created yesterday', () => {
      const time = new Date('2023-12-31T10:00:00Z').toISOString();
      expect(formatNotificationTime(time)).toBe('昨天 18:00'); // 时区原因显示为 18:00
    });

    it('should return days ago for notifications created less than a week ago', () => {
      const time = new Date('2023-12-26T12:00:00Z').toISOString();
      expect(formatNotificationTime(time)).toBe('6d ago');
    });

    it('should return date string for older notifications', () => {
      const time = new Date('2023-12-01T12:00:00Z').toISOString();
      const expected = new Date('2023-12-01T12:00:00Z').toLocaleDateString([], { month: 'short', day: 'numeric' });
      expect(formatNotificationTime(time)).toBe(expected);
    });
  });

  describe('notificationTypeLabel', () => {
    it('should return "Likes" for like notifications', () => {
      const notification = { type: 'like' } as Notification;
      expect(notificationTypeLabel(notification)).toBe('Likes');
    });

    it('should return "Saves" for favorite notifications', () => {
      const notification = { type: 'favorite' } as Notification;
      expect(notificationTypeLabel(notification)).toBe('Saves');
    });

    it('should return "Replies" for comment notifications', () => {
      const notification = { type: 'comment' } as Notification;
      expect(notificationTypeLabel(notification)).toBe('Replies');
    });

    it('should return "Follows" for follow notifications', () => {
      const notification = { type: 'follow' } as Notification;
      expect(notificationTypeLabel(notification)).toBe('Follows');
    });
  });

  describe('notificationActorLabel', () => {
    it('should return nickname when available', () => {
      const notification = {
        actor: { nickname: '张三', username: 'zhangsan' },
      } as Notification;
      expect(notificationActorLabel(notification)).toBe('张三');
    });

    it('should return @username when nickname is empty', () => {
      const notification = {
        actor: { nickname: '', username: 'zhangsan' },
      } as Notification;
      expect(notificationActorLabel(notification)).toBe('@zhangsan');
    });

    it('should return "Someone" when both nickname and username are empty', () => {
      const notification = {
        actor: { nickname: '', username: '' },
      } as Notification;
      expect(notificationActorLabel(notification)).toBe('Someone');
    });
  });

  describe('notificationActorHandle', () => {
    it('should return @username when available', () => {
      const notification = {
        actorId: 'abc123',
        actor: { username: 'zhangsan' },
      } as Notification;
      expect(notificationActorHandle(notification)).toBe('@zhangsan');
    });

    it('should return ID with first 8 chars when username is empty', () => {
      const notification = {
        actorId: 'abcdefghij',
        actor: { username: '' },
      } as Notification;
      expect(notificationActorHandle(notification)).toBe('ID abcdefgh');
    });
  });

  describe('notificationActorInitial', () => {
    it('should return first letter of nickname', () => {
      const notification = {
        actor: { nickname: 'zhangsan', username: 'zs' },
      } as Notification;
      expect(notificationActorInitial(notification)).toBe('Z');
    });

    it('should return first letter of username when nickname is empty', () => {
      const notification = {
        actor: { nickname: '', username: 'zhangsan' },
      } as Notification;
      expect(notificationActorInitial(notification)).toBe('@'); // 返回的是 @username 的首字母
    });

    it('should return "S" as default', () => {
      const notification = {
        actor: { nickname: '', username: '' },
      } as Notification;
      expect(notificationActorInitial(notification)).toBe('S');
    });
  });

  describe('formatNotificationMessage', () => {
    it('should return default message when message is empty', () => {
      const notification = {
        message: '',
        actor: { nickname: '张三' },
      } as Notification;
      expect(formatNotificationMessage(notification)).toBe('You have a new notification.');
    });

    it('should format like notification message', () => {
      const notification = {
        message: 'liked your post',
        actor: { nickname: '张三' },
      } as Notification;
      expect(formatNotificationMessage(notification)).toBe('张三 liked your post.');
    });

    it('should format comment notification message', () => {
      const notification = {
        message: 'commented on your post',
        actor: { nickname: '李四' },
      } as Notification;
      expect(formatNotificationMessage(notification)).toBe('李四 commented on your post.');
    });

    it('should format follow notification message', () => {
      const notification = {
        message: 'started following you',
        actor: { nickname: '王五' },
      } as Notification;
      expect(formatNotificationMessage(notification)).toBe('王五 started following you.');
    });

    it('should format favorite notification message with folder name', () => {
      const notification = {
        message: 'favorited your post into Reading List',
        actor: { nickname: '赵六' },
      } as Notification;
      expect(formatNotificationMessage(notification)).toBe('赵六 saved your post to "Reading List".');
    });
  });
});
