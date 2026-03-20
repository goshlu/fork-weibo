import { useState, useEffect, useRef } from 'react';
import type { Notification } from '../../types/app';
import { FilterTabs } from '../ui/FilterTabs';
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

type NotificationGroup = { label: string; items: Notification[] };

function groupNotificationsByDate(notifications: Notification[]): NotificationGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const groups: Record<string, Notification[]> = { '今天': [], '昨天': [], '更早': [] };
  for (const n of notifications) {
    const t = new Date(n.createdAt).getTime();
    if (t >= todayStart) groups['今天'].push(n);
    else if (t >= yesterdayStart) groups['昨天'].push(n);
    else groups['更早'].push(n);
  }

  return (['今天', '昨天', '更早'] as const)
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }));
}

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'favorite';

type NotificationsPageProps = {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onOpenNotification: (notification: Notification) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
};

export function NotificationsPage({
  notifications,
  onMarkAllRead,
  onMarkOneRead,
  onOpenNotification,
  onLoadMore,
  hasMore = false,
  loadingMore = false
}: NotificationsPageProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, loadingMore]);

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter((n) => n.type === activeFilter);

  const groups = groupNotificationsByDate(filteredNotifications);

  return (
    <>
      <div className="toolbar simple-toolbar page-toolbar">
        <div>
          <p className="section-label">Notification Center</p>
          <h2>All notifications</h2>
        </div>
        <button className="ghost-button" onClick={onMarkAllRead} type="button">
          Mark all read
        </button>
      </div>

      <FilterTabs
        activeFilter={activeFilter}
        onChange={setActiveFilter}
        notifications={notifications}
      />

      <div className="notification-page-list">
        {notifications.length ? (
          groups.map((group) => (
            <div className="notification-group" key={group.label}>
              <p className="notification-group-label">{group.label}</p>
              {group.items.map((item) => (
                <div
                  className="notification-page-card-wrapper"
                  key={item.id}
                >
                  <button
                    className={item.isRead ? 'notification-page-card read' : 'notification-page-card'}
                    onClick={() => onOpenNotification(item)}
                    type="button"
                  >
                    {!item.isRead && (
                      <button
                        className="notification-mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkOneRead(item.id);
                        }}
                        title="Mark as read"
                        type="button"
                      >
                        ✓
                      </button>
                    )}
                    <div className="notification-card-head">
                      <div className="notification-actor-avatar-wrap">
                        <div className="notification-actor-avatar notification-actor-avatar-large">
                          {item.actor?.avatarUrl ? (
                            <img alt={notificationActorLabel(item)} className="notification-actor-avatar-image" src={resolveMediaUrl(item.actor.avatarUrl)} />
                          ) : (
                            <span>{notificationActorInitial(item)}</span>
                          )}
                        </div>
                        {!item.isRead && <span aria-label="未读" className="notification-unread-dot" />}
                      </div>
                      <div className="notification-copy">
                        <div className="post-meta notification-meta-row">
                          <span>{notificationTypeLabel(item)}</span>
                          <span>{formatNotificationTime(item.createdAt)}</span>
                        </div>
                        <div className="notification-actor-meta">
                          <strong>{notificationActorLabel(item)}</strong>
                          <span>{notificationActorHandle(item)}</span>
                        </div>
                        <p>{formatNotificationMessage(item)}</p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state empty-state-large">
            <strong>Inbox cleared.</strong>
            <p>New likes, follows, comments, and favorites will appear here.</p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} style={{ height: '40px' }} />}
        {loadingMore && (
          <div className="empty-state" style={{ marginTop: '12px' }}>
            Loading more...
          </div>
        )}
        {!hasMore && notifications.length > 0 && (
          <div className="empty-state" style={{ marginTop: '12px' }}>
            No more notifications
          </div>
        )}
      </div>
    </>
  );
}
