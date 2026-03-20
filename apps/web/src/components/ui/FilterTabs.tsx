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
  const tabs: FilterTab[] = [
    { key: 'all', label: '全部', unreadCount: notifications.filter((n) => !n.isRead).length },
    {
      key: 'like',
      label: '点赞',
      unreadCount: notifications.filter((n) => !n.isRead && n.type === 'like').length,
    },
    {
      key: 'comment',
      label: '评论',
      unreadCount: notifications.filter((n) => !n.isRead && n.type === 'comment').length,
    },
    {
      key: 'follow',
      label: '关注',
      unreadCount: notifications.filter((n) => !n.isRead && n.type === 'follow').length,
    },
    {
      key: 'favorite',
      label: '收藏',
      unreadCount: notifications.filter((n) => !n.isRead && n.type === 'favorite').length,
    },
  ];

  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          className={activeFilter === tab.key ? 'filter-tab active' : 'filter-tab'}
          key={tab.key}
          onClick={() => onChange(tab.key)}
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
