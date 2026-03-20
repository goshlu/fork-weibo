import type { Dispatch, SetStateAction } from 'react';

import { viewTitles, type AuthFormState, type AuthMode, type Notification, type User, type ViewMode } from '../types/app';

function resolveMediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

function formatNotificationTime(createdAt: string): string {
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

function notificationTypeLabel(notification: Notification): string {
  if (notification.type === 'like') return 'Likes';
  if (notification.type === 'favorite') return 'Saves';
  if (notification.type === 'comment') return 'Replies';
  return 'Follows';
}

function notificationActionLabel(notification: Notification): string {
  if (notification.entityType === 'comment') return 'Jump to comment';
  if (notification.entityType === 'post') return 'View post';
  return 'Open profile';
}

function notificationActorLabel(notification: Notification): string {
  const nickname = notification.actor?.nickname?.trim();
  if (nickname) return nickname;
  const username = notification.actor?.username?.trim();
  if (username) return `@${username}`;
  return 'Someone';
}

function notificationActorHandle(notification: Notification): string {
  const username = notification.actor?.username?.trim();
  if (username) return `@${username}`;
  return `ID ${notification.actorId.slice(0, 8)}`;
}

function notificationActorInitial(notification: Notification): string {
  return notificationActorLabel(notification).trim().charAt(0).toUpperCase() || 'S';
}

function formatNotificationMessage(notification: Notification): string {
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

type LeftSidebarProps = {
  authMode: AuthMode;
  authForm: AuthFormState;
  busy: string;
  currentUser: User | null;
  notifications: Notification[];
  viewMode: ViewMode;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthFormChange: Dispatch<SetStateAction<AuthFormState>>;
  onOpenNotification: (notification: Notification) => void;
  onSubmitAuth: () => void;
  onMarkNotificationsRead: () => void;
  onLogout: () => void;
  onViewModeChange: (mode: ViewMode) => void;
};

export function LeftSidebar(props: LeftSidebarProps) {
  const {
    authMode,
    authForm,
    busy,
    currentUser,
    notifications,
    viewMode,
    onAuthModeChange,
    onAuthFormChange,
    onOpenNotification,
    onSubmitAuth,
    onMarkNotificationsRead,
    onLogout,
    onViewModeChange,
  } = props;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <section className="panel left-panel sidebar-panel">
      <div className="brand-block sidebar-hero">
        <p className="eyebrow">fork-weibo</p>
        <h1>Social Dashboard</h1>
        <p className="lede">
          Service layer, state layer, and component layer are separated. Profile, drafts,
          and notifications are now first-class pages.
        </p>
      </div>

      <div className="sidebar-card sidebar-nav-card">
        <div className="sidebar-card-head">
          <p className="section-label">Workspace</p>
          <span className="sidebar-pill">{unreadCount} unread</span>
        </div>
        <div className="nav-list sidebar-nav-list">
          {(['feed', 'profile', 'drafts', 'notifications'] as ViewMode[]).map((mode) => (
            <button
              className={viewMode === mode ? 'nav-button active' : 'nav-button'}
              key={mode}
              onClick={() => onViewModeChange(mode)}
              type="button"
            >
              <span>{viewTitles[mode]}</span>
              {mode === 'notifications' ? (
                unreadCount > 0 ? (
                  <span className="nav-unread-badge">{Math.min(unreadCount, 99)}</span>
                ) : null
              ) : (
                <strong>&gt;</strong>
              )}
            </button>
          ))}
        </div>
      </div>

      {!currentUser ? (
        <div className="sidebar-card sidebar-auth-card">
          <div className="sidebar-card-head">
            <p className="section-label">Access</p>
            <span className="sidebar-muted">Guest mode</span>
          </div>

          <div className="auth-switch">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => onAuthModeChange('login')}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => onAuthModeChange('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitAuth();
            }}
          >
            <label>
              Username
              <input
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="coder01"
                value={authForm.username}
              />
            </label>
            <label>
              Password
              <input
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="At least 8 chars"
                type="password"
                value={authForm.password}
              />
            </label>
            {authMode === 'register' ? (
              <label>
                Nickname
                <input
                  onChange={(event) =>
                    onAuthFormChange((prev) => ({ ...prev, nickname: event.target.value }))
                  }
                  placeholder="Display name"
                  value={authForm.nickname}
                />
              </label>
            ) : null}
            <button className="primary-button sidebar-submit" disabled={busy === 'auth'} type="submit">
              {busy === 'auth' ? 'Working...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        </div>
      ) : (
        <div className="sidebar-card sidebar-session-card">
          <div className="sidebar-card-head">
            <p className="section-label">Session</p>
            <span className="sidebar-status">Online</span>
          </div>
          <div className="session-summary">
            <div className="session-avatar">{currentUser.nickname.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{currentUser.nickname}</strong>
              <p>@{currentUser.username}</p>
            </div>
          </div>
          <button className="ghost-button sidebar-logout" onClick={onLogout} type="button">
            Logout
          </button>
        </div>
      )}

      <div className="sidebar-card sidebar-notice-card">
        <div className="inline-head sidebar-card-head">
          <div>
            <p className="section-label">Notifications</p>
            <h3>Preview</h3>
          </div>
          <button className="ghost-button" onClick={onMarkNotificationsRead} type="button">
            Mark all read
          </button>
        </div>
        <div className="notification-list sidebar-notification-list">
          {notifications.length ? (
            notifications.slice(0, 4).map((item) => (
              <button
                className={item.isRead ? 'notification-row read' : 'notification-row'}
                key={item.id}
                onClick={() => onOpenNotification(item)}
                type="button"
              >
                <div className="notification-row-content">
                  <div className="notification-actor-avatar">
                    {item.actor?.avatarUrl ? (
                      <img alt={notificationActorLabel(item)} className="notification-actor-avatar-image" src={resolveMediaUrl(item.actor.avatarUrl)} />
                    ) : (
                      <span>{notificationActorInitial(item)}</span>
                    )}
                  </div>
                  <div className="notification-copy">
                    <div className="notification-preview-head">
                      <strong>{notificationTypeLabel(item)}</strong>
                      <span>{notificationActionLabel(item)}</span>
                    </div>
                    <div className="notification-actor-meta">
                      <strong>{notificationActorLabel(item)}</strong>
                      <span>{notificationActorHandle(item)} · {formatNotificationTime(item.createdAt)}</span>
                    </div>
                    <p>{formatNotificationMessage(item)}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="sidebar-empty">No notifications yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
