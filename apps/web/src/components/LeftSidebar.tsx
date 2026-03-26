import type { Dispatch, SetStateAction } from 'react';

import { Home, User as UserIcon, FileText, Bell, LogOut, Globe, ChevronRight, CheckCheck, Mail, Heart, Bookmark, MessageCircle, UserPlus } from 'lucide-react';

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

  const navIcons: Record<string, React.ReactNode> = {
    feed: <Home size={18} />,
    profile: <UserIcon size={18} />,
    drafts: <FileText size={18} />,
    notifications: <Bell size={18} />,
  };

  const notificationTypeIcon: Record<string, React.ReactNode> = {
    like: <Heart size={14} className="notif-icon notif-icon-like" />,
    save: <Bookmark size={14} className="notif-icon notif-icon-save" />,
    comment: <MessageCircle size={14} className="notif-icon notif-icon-comment" />,
    follow: <UserPlus size={14} className="notif-icon notif-icon-follow" />,
  };

  return (
    <section className="panel left-panel sidebar-panel grid gap-4 content-start min-w-0 w-full max-w-full overflow-hidden">
      {/* Brand Hero */}
      <div className="relative p-6 rounded-3xl overflow-hidden bg-linear-to-br from-[rgba(203,106,67,0.18)] to-[rgba(255,255,255,0.56)] border border-[rgba(22,17,15,0.06)]">
        <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-linear-to-br from-[rgba(203,106,67,0.15)] to-[rgba(164,69,43,0.08)] pointer-events-none" />
        <p className="text-xs tracking-widest uppercase text-[#9b5d3e] mb-2.5">社交网站</p>
        <p className="sidebar-hero-title">{sidebar.title}</p>
        <p className="sidebar-hero-description">{sidebar.description}</p>
        {/* Language Switch */}
        <div className="inline-flex flex-wrap items-center gap-2.5 mt-3 px-2.5 py-1 pr-2.5 rounded-full bg-[rgba(255,255,255,0.4)] border border-[rgba(22,17,15,0.04)]">
          <Globe size={14} className="text-[#9b5d3e] opacity-80 shrink-0" />
          <button
            className={`px-3 py-1 text-sm rounded-full transition-colors ${locale === 'zh' ? 'bg-[#1d5d68] text-[#f5f0e8]' : 'bg-transparent text-inherit'}`}
            onClick={() => setLocale('zh')}
            type="button"
          >
            {dictionary.common.chinese}
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full transition-colors ${locale === 'en' ? 'bg-[#1d5d68] text-[#f5f0e8]' : 'bg-transparent text-inherit'}`}
            onClick={() => setLocale('en')}
            type="button"
          >
            {dictionary.common.english}
          </button>
        </div>
      </div>

      {/* Navigation Card */}
      <div className="p-4.5 rounded-3xl bg-[rgba(255,255,255,0.62)] border border-[rgba(22,17,15,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <div className="flex flex-wrap justify-between items-start gap-2.5 mb-3.5">
          <p className="text-xs tracking-widest uppercase text-[#9b5d3e]">{sidebar.workspace}</p>
          <span className="text-xs px-2.5 py-1.5 rounded-full shrink-0 bg-[rgba(29,93,104,0.12)] text-[#1d5d68]">
            {formatTemplate(sidebar.unread, { count: unreadCount })}
          </span>
        </div>
        <div className="grid gap-2">
          {(['feed', 'profile', 'drafts', 'notifications'] as ViewMode[]).map((mode) => (
            <button
              className={`group flex items-center gap-3 px-3.5 py-3 min-h-12 w-full rounded-full transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-linear-to-br from-[#1d5d68] to-[#1a4f58] text-[#f5f0e8] shadow-[0_4px_12px_rgba(29,93,104,0.25)]'
                  : 'bg-[rgba(255,255,255,0.84)] border border-[rgba(22,17,15,0.1)] hover:bg-[rgba(255,255,255,0.96)] hover:translate-x-1.5 hover:border-[rgba(29,93,104,0.2)]'
              }`}
              key={mode}
              onClick={() => onViewModeChange(mode)}
              type="button"
            >
              <span className={`shrink-0 flex items-center justify-center transition-opacity ${viewMode === mode ? 'opacity-100' : 'opacity-70'}`}>
                {navIcons[mode]}
              </span>
              <span className="flex-1 min-w-0 truncate text-left">{viewTitles[mode]}</span>
              {mode === 'notifications' ? (
                unreadCount > 0 && (
                  <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#cb6a43] text-white text-xs font-bold flex items-center justify-center shadow-[0_2px_6px_rgba(203,106,67,0.3)]">
                    {Math.min(unreadCount, 99)}
                  </span>
                )
              ) : (
                <ChevronRight size={16} className={`shrink-0 transition-all ${viewMode === mode ? 'opacity-100' : 'opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Auth Card */}
      {!currentUser ? (
        <div className="p-4.5 rounded-3xl bg-[rgba(255,255,255,0.62)] border border-[rgba(22,17,15,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <div className="flex flex-wrap justify-between items-start gap-2.5 mb-3.5">
            <p className="text-xs tracking-widest uppercase text-[#9b5d3e]">{sidebar.access}</p>
            <span className="text-xs px-2.5 py-1.5 rounded-full shrink-0 bg-[rgba(22,17,15,0.06)] text-[rgba(22,17,15,0.58)]">{sidebar.guestMode}</span>
          </div>

          <div className="grid grid-cols-2 gap-0 mb-4">
            <button
              className={`py-2.5 px-3.5 rounded-full border transition-colors ${authMode === 'login' ? 'bg-[#1d5d68] text-[#f5f0e8] border-[#1d5d68]' : 'bg-[rgba(255,255,255,0.65)] border-[rgba(22,17,15,0.1)]'}`}
              onClick={() => onAuthModeChange('login')}
              type="button"
            >
              {sidebar.login}
            </button>
            <button
              className={`py-2.5 px-3.5 rounded-full border transition-colors ${authMode === 'register' ? 'bg-[#1d5d68] text-[#f5f0e8] border-[#1d5d68]' : 'bg-[rgba(255,255,255,0.65)] border-[rgba(22,17,15,0.1)]'}`}
              onClick={() => onAuthModeChange('register')}
              type="button"
            >
              {sidebar.register}
            </button>
          </div>

          <form
            className="block"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitAuth();
            }}
          >
            <label className="block mb-3 text-[rgba(22,17,15,0.8)]">
              {sidebar.username}
              <input
                className="w-full mt-1.5 px-3.5 py-3 rounded-2xl border border-[rgba(22,17,15,0.12)] bg-[rgba(255,255,255,0.92)] focus:outline-none focus:border-[rgba(29,93,104,0.3)]"
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="coder01"
                value={authForm.username}
              />
            </label>
            <label className="block mb-3 text-[rgba(22,17,15,0.8)]">
              {sidebar.password}
              <input
                className="w-full mt-1.5 px-3.5 py-3 rounded-2xl border border-[rgba(22,17,15,0.12)] bg-[rgba(255,255,255,0.92)] focus:outline-none focus:border-[rgba(29,93,104,0.3)]"
                onChange={(event) =>
                  onAuthFormChange((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder={sidebar.passwordPlaceholder}
                type="password"
                value={authForm.password}
              />
            </label>
            {authMode === 'register' && (
              <label className="block mb-3 text-[rgba(22,17,15,0.8)]">
                {sidebar.nickname}
                <input
                  className="w-full mt-1.5 px-3.5 py-3 rounded-2xl border border-[rgba(22,17,15,0.12)] bg-[rgba(255,255,255,0.92)] focus:outline-none focus:border-[rgba(29,93,104,0.3)]"
                  onChange={(event) =>
                    onAuthFormChange((prev) => ({ ...prev, nickname: event.target.value }))
                  }
                  placeholder={sidebar.nicknamePlaceholder}
                  value={authForm.nickname}
                />
              </label>
            )}
            <button
              className="w-full py-3 px-4.5 rounded-full bg-linear-to-br from-[#cb6a43] to-[#a4452b] text-[#fff9f3] shadow-[0_10px_24px_rgba(164,69,43,0.18)] disabled:opacity-70 disabled:cursor-wait transition-opacity"
              disabled={busy === 'auth'}
              type="submit"
            >
              {busy === 'auth' ? sidebar.authWorking : authMode === 'login' ? sidebar.login : sidebar.register}
            </button>
          </form>
        </div>
      ) : (
        /* Session Card */
        <div className="p-4.5 rounded-3xl bg-[rgba(255,255,255,0.62)] border border-[rgba(22,17,15,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <div className="flex flex-wrap justify-between items-start gap-2.5 mb-3.5">
            <p className="text-xs tracking-widest uppercase text-[#9b5d3e]">{sidebar.session}</p>
            <span className="inline-flex items-center text-xs px-2.5 py-1.5 rounded-full shrink-0 bg-[rgba(90,150,96,0.14)] text-[#2f6a35]">
              <span className="w-2 h-2 rounded-full bg-[#5a9660] mr-1.5 animate-pulse" />
              {sidebar.online}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-linear-to-br from-[#cb6a43] to-[#a4452b] text-[#fff9f3] font-bold shrink-0 overflow-hidden">
              {currentUser.avatarUrl ? (
                <img alt={currentUser.nickname} className="w-full h-full object-cover" src={resolveMediaUrl(currentUser.avatarUrl)} />
              ) : (
                currentUser.nickname.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate">{currentUser.nickname}</strong>
              <p className="m-0 text-[rgba(22,17,15,0.58)] text-sm truncate">@{currentUser.username}</p>
            </div>
          </div>
          <button
            className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-full border border-[rgba(22,17,15,0.1)] bg-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.85)] transition-colors"
            onClick={onLogout}
            type="button"
          >
            <LogOut size={16} className="shrink-0" />
            <span>{sidebar.logout}</span>
          </button>
        </div>
      )}

      {/* Notifications Card */}
      <div className="p-4.5 rounded-3xl bg-[rgba(255,255,255,0.62)] border border-[rgba(22,17,15,0.08)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <div className="flex flex-col gap-2.5 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-linear-to-br from-[rgba(29,93,104,0.12)] to-[rgba(29,93,104,0.06)]">
              <Bell size={16} className="text-[#1d5d68]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs tracking-widest uppercase text-[#9b5d3e]">{sidebar.notifications}</p>
              <h3 className="text-base font-semibold mt-0.5 whitespace-nowrap">{sidebar.preview}</h3>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-sm rounded-full border border-[rgba(22,17,15,0.1)] bg-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.85)] transition-colors"
            onClick={onMarkNotificationsRead}
            type="button"
          >
            <CheckCheck size={16} className="shrink-0" />
            <span>{sidebar.markAllRead}</span>
          </button>
        </div>
        <div className="grid gap-2">
          {notifications.length ? (
            notifications.slice(0, 4).map((item) => (
              <button
                className={`w-full text-left p-4 rounded-3xl transition-all duration-200 ${
                  item.isRead
                    ? 'bg-[rgba(22,93,104,0.08)] opacity-60'
                    : 'bg-[rgba(22,93,104,0.08)] hover:bg-[rgba(22,93,104,0.14)] hover:-translate-y-0.5'
                }`}
                key={item.id}
                onClick={() => onOpenNotification(item)}
                type="button"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="relative shrink-0">
                    {!item.isRead && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#cb6a43] border-2 border-[#fff8f0]" aria-label={sidebar.unreadDotLabel} />
                    )}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-linear-to-br from-[rgba(203,106,67,0.22)] to-[rgba(164,69,43,0.86)] text-[#fff8f0] font-bold overflow-hidden">
                      {item.actor?.avatarUrl ? (
                        <img alt={notificationActorLabel(item, dictionary)} className="w-full h-full object-cover" src={resolveMediaUrl(item.actor.avatarUrl)} />
                      ) : (
                        <span>{notificationActorInitial(item, dictionary)}</span>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm min-w-0">
                      <span className="flex items-center shrink-0">
                        {notificationTypeIcon[item.type] || <Mail size={14} className="text-[#1d5d68]" />}
                      </span>
                      <strong className="capitalize truncate max-w-[40%]">{notificationTypeLabel(item, dictionary)}</strong>
                      <span className="text-[#1d5d68] font-medium truncate">{notificationActionLabel(item, sidebar)}</span>
                    </div>
                    <div className="mt-1 text-sm min-w-0">
                      <strong className="block truncate">{notificationActorLabel(item, dictionary)}</strong>
                      <span className="block text-[rgba(22,17,15,0.58)] truncate">
                        {notificationActorHandle(item)} · {formatNotificationTime(item.createdAt, dictionary, locale)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-sm leading-relaxed line-clamp-2">{formatNotificationMessage(item, dictionary)}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 px-4 gap-3">
              <Bell size={32} className="text-[rgba(22,17,15,0.2)]" />
              <p className="m-0 text-[rgba(22,17,15,0.56)] text-center">{sidebar.noNotifications}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
