import type { Notification } from '../../types/app';

type NotificationsPageProps = { notifications: Notification[]; onMarkAllRead: () => void };

export function NotificationsPage({ notifications, onMarkAllRead }: NotificationsPageProps) {
  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">Notification Center</p>
          <h2>All notifications</h2>
        </div>
        <button className="ghost-button" onClick={onMarkAllRead} type="button">
          Mark all read
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
          <div className="empty-state">No notifications right now.</div>
        )}
      </div>
    </>
  );
}