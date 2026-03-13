import type { Notification } from '../../types/app';

type NotificationsPageProps = { notifications: Notification[]; onMarkAllRead: () => void };

export function NotificationsPage({ notifications, onMarkAllRead }: NotificationsPageProps) {
  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">通知中心</p>
          <h2>全部通知</h2>
        </div>
        <button className="ghost-button" onClick={onMarkAllRead} type="button">
          标记已读
        </button>
      </div>
      <div className="notification-page-list">
        {notifications.length ? (
          notifications.map((item) => (
            <article className={item.isRead ? 'notification-page-card read' : 'notification-page-card'} key={item.id}>
              <div className="post-meta">
                <span>{item.type}</span>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
              </div>
              <p>{item.message}</p>
            </article>
          ))
        ) : (
          <div className="empty-state">目前没有通知。</div>
        )}
      </div>
    </>
  );
}