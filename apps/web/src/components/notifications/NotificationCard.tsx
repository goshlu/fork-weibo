import { memo, useCallback } from 'react';
import { useI18n } from '../../i18n';
import type { Notification } from '../../types/app';
import {
  formatNotificationTime,
  notificationTypeLabel,
  notificationActorLabel,
  notificationActorHandle,
  notificationActorInitial,
  formatNotificationMessage,
} from '../../utils/notification';

function resolveMediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

type NotificationCardProps = {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
};

export const NotificationCard = memo(function NotificationCard({ notification, onMarkRead, onClick }: NotificationCardProps) {
  const { dictionary, locale } = useI18n();

  const handleClick = useCallback(() => {
    onClick?.(notification);
  }, [onClick, notification]);

  const handleMarkReadClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead?.(notification.id);
  }, [onMarkRead, notification.id]);

  return (
    <div className="notification-page-card-wrapper">
      <button
        className={notification.isRead ? 'notification-page-card read' : 'notification-page-card'}
        onClick={handleClick}
        type="button"
      >
        {!notification.isRead && onMarkRead && (
          <button
            className="notification-mark-read-btn"
            onClick={handleMarkReadClick}
            title={dictionary.sidebar.markAsRead}
            type="button"
          >
            ✓
          </button>
        )}
        <div className="notification-card-head">
          <div className="notification-actor-avatar-wrap">
            <div className="notification-actor-avatar notification-actor-avatar-large">
              {notification.actor?.avatarUrl ? (
                <img
                  alt={notificationActorLabel(notification, dictionary)}
                  className="notification-actor-avatar-image"
                  src={resolveMediaUrl(notification.actor.avatarUrl)}
                />
              ) : (
                <span>{notificationActorInitial(notification, dictionary)}</span>
              )}
            </div>
            {!notification.isRead && <span aria-label={dictionary.sidebar.unreadDotLabel} className="notification-unread-dot" />}
          </div>
          <div className="notification-copy">
            <div className="post-meta notification-meta-row">
              <span>{notificationTypeLabel(notification, dictionary)}</span>
              <span>{formatNotificationTime(notification.createdAt, dictionary, locale)}</span>
            </div>
            <div className="notification-actor-meta">
              <strong>{notificationActorLabel(notification, dictionary)}</strong>
              <span>{notificationActorHandle(notification)}</span>
            </div>
            <p>{formatNotificationMessage(notification, dictionary)}</p>
          </div>
        </div>
      </button>
    </div>
  );
});
