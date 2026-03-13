import type { Dispatch, SetStateAction } from 'react';

import type { AuthFormState, AuthMode, Notification, User } from '../types/app';

type LeftSidebarProps = {
  authMode: AuthMode;
  authForm: AuthFormState;
  busy: string;
  currentUser: User | null;
  notifications: Notification[];
  onAuthModeChange: (mode: AuthMode) => void;
  onAuthFormChange: Dispatch<SetStateAction<AuthFormState>>;
  onSubmitAuth: () => void;
  onMarkNotificationsRead: () => void;
  onLogout: () => void;
};

export function LeftSidebar({
  authMode,
  authForm,
  busy,
  currentUser,
  notifications,
  onAuthModeChange,
  onAuthFormChange,
  onSubmitAuth,
  onMarkNotificationsRead,
  onLogout,
}: LeftSidebarProps) {
  return (
    <section className="panel left-panel">
      <div className="brand-block">
        <p className="eyebrow">fork-weibo</p>
        <h1>微博式社区控制台</h1>
        <p className="lede">现在前端已接入认证、发帖、信息流、搜索、点赞、评论、关注和通知。</p>
      </div>

      <div className="auth-switch">
        <button
          className={authMode === 'login' ? 'active' : ''}
          onClick={() => onAuthModeChange('login')}
          type="button"
        >
          登录
        </button>
        <button
          className={authMode === 'register' ? 'active' : ''}
          onClick={() => onAuthModeChange('register')}
          type="button"
        >
          注册
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
          用户名
          <input
            value={authForm.username}
            onChange={(event) =>
              onAuthFormChange((prev) => ({ ...prev, username: event.target.value }))
            }
            placeholder="例如 coder01"
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={authForm.password}
            onChange={(event) =>
              onAuthFormChange((prev) => ({ ...prev, password: event.target.value }))
            }
            placeholder="至少 8 位"
          />
        </label>
        {authMode === 'register' ? (
          <label>
            昵称
            <input
              value={authForm.nickname}
              onChange={(event) =>
                onAuthFormChange((prev) => ({ ...prev, nickname: event.target.value }))
              }
              placeholder="展示名"
            />
          </label>
        ) : null}
        <button className="primary-button" disabled={busy === 'auth'} type="submit">
          {busy === 'auth' ? '处理中...' : authMode === 'login' ? '登录' : '注册'}
        </button>
      </form>

      <div className="user-box">
        <h2>当前会话</h2>
        {currentUser ? (
          <div>
            <strong>{currentUser.nickname}</strong>
            <p>@{currentUser.username}</p>
            <button className="ghost-button" onClick={onLogout} type="button">
              退出
            </button>
          </div>
        ) : (
          <p>未登录时仍可查看热门流和公开搜索。</p>
        )}
      </div>

      <div className="insight-block">
        <div className="inline-head">
          <h3>通知</h3>
          <button className="ghost-button" onClick={onMarkNotificationsRead} type="button">
            全部已读
          </button>
        </div>
        <div className="notification-list">
          {notifications.length ? (
            notifications.map((item) => (
              <div
                className={item.isRead ? 'notification-row read' : 'notification-row'}
                key={item.id}
              >
                <strong>{item.type}</strong>
                <p>{item.message}</p>
              </div>
            ))
          ) : (
            <p>暂无通知。</p>
          )}
        </div>
      </div>
    </section>
  );
}
