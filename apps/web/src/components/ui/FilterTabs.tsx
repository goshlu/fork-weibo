import { useMemo, useCallback } from 'react';
import { useI18n } from '../../i18n';
import type { Notification } from '../../types/app';

type FilterType = 'all' | 'like' | 'comment' | 'follow' | 'favorite';

type FilterTab = {
  key: FilterType;
  label: string;
  unreadCount: number;
};

type FilterTabsProps = {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
  notifications: Notification[];
};

export function FilterTabs({ activeFilter, onChange, notifications }: FilterTabsProps) {
  const { dictionary } = useI18n();

  // Compute unread counts once with a single pass through notifications
  const unreadCounts = useMemo(() => {
    const counts: Record<FilterType, number> = { all: 0, like: 0, comment: 0, follow: 0, favorite: 0 };
    for (const n of notifications) {
      if (!n.isRead) {
        counts.all++;
        if (n.type === 'like' || n.type === 'comment' || n.type === 'follow' || n.type === 'favorite') {
          counts[n.type]++;
        }
      }
    }
    return counts;
  }, [notifications]);

  const tabs: FilterTab[] = useMemo(() => [
    { key: 'all', label: dictionary.notifications.tabAll, unreadCount: unreadCounts.all },
    { key: 'like', label: dictionary.notifications.tabLike, unreadCount: unreadCounts.like },
    { key: 'comment', label: dictionary.notifications.tabComment, unreadCount: unreadCounts.comment },
    { key: 'follow', label: dictionary.notifications.tabFollow, unreadCount: unreadCounts.follow },
    { key: 'favorite', label: dictionary.notifications.tabFavorite, unreadCount: unreadCounts.favorite },
  ], [dictionary.notifications, unreadCounts]);

  const handleClick = useCallback((key: FilterType) => {
    onChange(key);
  }, [onChange]);

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          className={activeFilter === tab.key ? 'filter-tab active' : 'filter-tab'}
          key={tab.key}
          onClick={() => handleClick(tab.key)}
          type="button"
        >
          {tab.label}
          {tab.unreadCount > 0 && (
            <span className="filter-tab-badge">{Math.min(tab.unreadCount, 99)}</span>
          )}
        </button>
      ))}
    </div>
  );
}
