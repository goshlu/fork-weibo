import type { Notification } from '../types/app';

export function formatNotificationTime(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return createdAt;

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;

  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate()).getTime();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayDiff = Math.round((todayDay - createdDay) / day);
  const timeText = created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (dayDiff === 1) return `昨天 ${timeText}`;
  if (dayDiff < 7) return `${dayDiff}d ago`;

  return created.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function notificationTypeLabel(notification: Notification): string {
  if (notification.type === 'like') return 'Likes';
  if (notification.type === 'favorite') return 'Saves';
  if (notification.type === 'comment') return 'Replies';
  return 'Follows';
}

export function notificationActorLabel(notification: Notification): string {
  const nickname = notification.actor?.nickname?.trim();
  if (nickname) return nickname;
  const username = notification.actor?.username?.trim();
  if (username) return `@${username}`;
  return 'Someone';
}

export function notificationActorHandle(notification: Notification): string {
  const username = notification.actor?.username?.trim();
  if (username) return `@${username}`;
  return `ID ${notification.actorId.slice(0, 8)}`;
}

export function notificationActorInitial(notification: Notification): string {
  return notificationActorLabel(notification).trim().charAt(0).toUpperCase() || 'S';
}

export function formatNotificationMessage(notification: Notification): string {
  const actor = notificationActorLabel(notification);
  const message = notification.message.trim();
  if (!message) return 'You have a new notification.';
  if (message === 'liked your post' || message === 'Someone liked your post.') return `${actor} liked your post.`;
  if (message === 'replied to your comment' || message === 'Someone replied to your comment.') return `${actor} replied to your comment.`;
  if (message === 'commented on your post' || message === 'Someone commented on your post.') return `${actor} commented on your post.`;
  if (message === 'started following you' || message === 'Someone started following you.') return `${actor} started following you.`;
  if (message.startsWith('favorited your post into ')) {
    const folderName = message.replace('favorited your post into ', '').trim();
    return `${actor} saved your post to "${folderName}".`;
  }
  if (/^Someone saved your post to ".+"\.$/.test(message)) {
    return message.replace(/^Someone/, actor);
  }
  if (/^Someone [^.]+\.$/.test(message)) {
    return message.replace(/^Someone/, actor);
  }
  return `${message.charAt(0).toUpperCase()}${message.slice(1)}.`;
}
