import { useMemo, useCallback } from 'react';
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
    { key: 'all', label: '全部', unreadCount: unreadCounts.all },
    { key: 'like', label: '点赞', unreadCount: unreadCounts.like },
    { key: 'comment', label: '评论', unreadCount: unreadCounts.comment },
    { key: 'follow', label: '关注', unreadCount: unreadCounts.follow },
    { key: 'favorite', label: '收藏', unreadCount: unreadCounts.favorite },
  ], [unreadCounts]);

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
