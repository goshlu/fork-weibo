import type { Dispatch, SetStateAction } from 'react';

import { useI18n, formatTemplate } from '../i18n';
import { type AuthFormState, type AuthMode, type Notification, type User, type ViewMode } from '../types/app';
import {
  formatNotificationMessage,
  formatNotificationTime,
  notificationActorHandle,
  notificationActorInitial,
  notificationActorLabel,
  notificationTypeLabel,
} from '../utils/notification';

function resolveMediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

function notificationActionLabel(notification: Notification, texts: ReturnType<typeof useI18n>['dictionary']['sidebar']): string {
  if (notification.entityType === 'comment') return texts.actionJumpToComment;
  if (notification.entityType === 'post') return texts.actionViewPost;
  return texts.actionOpenProfile;
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
  const { locale, setLocale, dictionary } = useI18n();
  const viewTitles = dictionary.viewTitles;
  const sidebar = dictionary.sidebar;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <section className="panel left-panel sidebar-panel">
      <div className="brand-block sidebar-hero">
        <p className="eyebrow">fork-weibo</p>
        <h1>{sidebar.title}</h1>
        <p className="lede">{sidebar.description}</p>
        <div className="segmented-inline" style={{ marginTop: 8 }}>
          <span className="section-label">{dictionary.common.language}</span>
          <button className={locale === 'zh' ? 'active' : ''} onClick={() => setLocale('zh')} type="button">{dictionary.common.chinese}</button>
          <button className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')} type="button">{dictionary.common.english}</button>
        </div>
      </div>

      <div className="sidebar-card sidebar-nav-card">
        <div className="sidebar-card-head">
          <p className="section-label">{sidebar.workspace}</p>
          <span className="sidebar-pill">{formatTemplate(sidebar.unread, { count: unreadCount })}</span>
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
            <p className="section-label">{sidebar.access}</p>
            <span className="sidebar-muted">{sidebar.guestMode}</span>
          </div>

          <div className="auth-switch">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => onAuthModeChange('login')}
              type="button"
            >
              {sidebar.login}
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => onAuthModeChange('register')}
              type="button"
            >
              {sidebar.register}
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
              {sidebar.username}
              <input
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="coder01"
                value={authForm.username}
              />
            </label>
            <label>
              {sidebar.password}
              <input
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={sidebar.passwordPlaceholder}
                type="password"
                value={authForm.password}
              />
            </label>
            {authMode === 'register' ? (
              <label>
                {sidebar.nickname}
                <input
                  onChange={(event) =>
                    onAuthFormChange((prev) => ({ ...prev, nickname: event.target.value }))
                  }
                  placeholder={sidebar.nicknamePlaceholder}
                  value={authForm.nickname}
                />
              </label>
            ) : null}
            <button className="primary-button sidebar-submit" disabled={busy === 'auth'} type="submit">
              {busy === 'auth' ? sidebar.authWorking : authMode === 'login' ? sidebar.login : sidebar.register}
            </button>
          </form>
        </div>
      ) : (
        <div className="sidebar-card sidebar-session-card">
          <div className="sidebar-card-head">
            <p className="section-label">{sidebar.session}</p>
            <span className="sidebar-status">{sidebar.online}</span>
          </div>
          <div className="session-summary">
            <div className="session-avatar">{currentUser.nickname.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{currentUser.nickname}</strong>
              <p>@{currentUser.username}</p>
            </div>
          </div>
          <button className="ghost-button sidebar-logout" onClick={onLogout} type="button">
            {sidebar.logout}
          </button>
        </div>
      )}

      <div className="sidebar-card sidebar-notice-card">
        <div className="inline-head sidebar-card-head">
          <div>
            <p className="section-label">{sidebar.notifications}</p>
            <h3>{sidebar.preview}</h3>
          </div>
          <button className="ghost-button" onClick={onMarkNotificationsRead} type="button">
            {sidebar.markAllRead}
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
                      <img alt={notificationActorLabel(item, dictionary)} className="notification-actor-avatar-image" src={resolveMediaUrl(item.actor.avatarUrl)} />
                    ) : (
                      <span>{notificationActorInitial(item, dictionary)}</span>
                    )}
                  </div>
                  <div className="notification-copy">
                    <div className="notification-preview-head">
                      <strong>{notificationTypeLabel(item, dictionary)}</strong>
                      <span>{notificationActionLabel(item, sidebar)}</span>
                    </div>
                    <div className="notification-actor-meta">
                      <strong>{notificationActorLabel(item, dictionary)}</strong>
                      <span>{notificationActorHandle(item)} · {formatNotificationTime(item.createdAt, dictionary, locale)}</span>
                    </div>
                    <p>{formatNotificationMessage(item, dictionary)}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="sidebar-empty">{sidebar.noNotifications}</p>
          )}
        </div>
      </div>
    </section>
  );
}
