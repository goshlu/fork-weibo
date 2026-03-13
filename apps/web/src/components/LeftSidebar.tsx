import type { Dispatch, SetStateAction } from 'react';

import { viewTitles, type AuthFormState, type AuthMode, type Notification, type User, type ViewMode } from '../types/app';

type LeftSidebarProps = {
  authMode: AuthMode;
  authForm: AuthFormState;
  busy: string;
  currentUser: User | null;
  notifications: Notification[];
  viewMode: ViewMode;
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthFormChange: Dispatch<SetStateAction<AuthFormState>>;
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
    onSubmitAuth,
    onMarkNotificationsRead,
    onLogout,
    onViewModeChange,
  } = props;

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <section className="panel left-panel">
      <div className="brand-block">
        <p className="eyebrow">fork-weibo</p>
        <h1>Social Dashboard</h1>
        <p className="lede">
          Service layer, state layer, and component layer are separated. Profile, drafts,
          and notifications are now first-class pages.
        </p>
      </div>

      <div className="nav-list">
        {(['feed', 'profile', 'drafts', 'notifications'] as ViewMode[]).map((mode) => (
          <button
            className={viewMode === mode ? 'nav-button active' : 'nav-button'}
            key={mode}
            onClick={() => onViewModeChange(mode)}
            type="button"
          >
            <span>{viewTitles[mode]}</span>
            {mode === 'notifications' ? <strong>{unreadCount}</strong> : null}
          </button>
        ))}
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
        <button className="primary-button" disabled={busy === 'auth'} type="submit">
          {busy === 'auth' ? 'Working...' : authMode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="user-box">
        <h2>Session</h2>
        {currentUser ? (
          <div>
            <strong>{currentUser.nickname}</strong>
            <p>@{currentUser.username}</p>
            <button className="ghost-button" onClick={onLogout} type="button">
              Logout
            </button>
          </div>
        ) : (
          <p>You can still browse the hot feed and public search results.</p>
        )}
      </div>

      <div className="insight-block">
        <div className="inline-head">
          <h3>Notification Preview</h3>
          <button className="ghost-button" onClick={onMarkNotificationsRead} type="button">
            Mark all read
          </button>
        </div>
        <div className="notification-list">
          {notifications.length ? (
            notifications.slice(0, 4).map((item) => (
              <div className={item.isRead ? 'notification-row read' : 'notification-row'} key={item.id}>
                <strong>{item.type}</strong>
                <p>{item.message}</p>
              </div>
            ))
          ) : (
            <p>No notifications yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}