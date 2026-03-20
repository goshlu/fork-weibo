# Notification Enhancements — Design

## 组件结构

```
NotificationsPage
├── FilterTabs          # 新增：类型筛选 tab 栏
├── notification-page-list
│   └── notification-group (今天/昨天/更早)
│       └── NotificationCard   # 新增：抽出为独立组件，含单条已读按钮
└── LoadMoreTrigger     # 新增：无限滚动哨兵元素
```

## 状态变更

### useDashboard.ts

- `notifications` 保持现有结构
- 新增 `markOneNotificationRead(id: string)` — 单条标记已读
- 新增 `notificationPage` / `notificationHasMore` — 分页状态
- 新增 `loadMoreNotifications()` — 加载下一页

### NotificationsPage props 新增

- `onMarkOneRead: (id: string) => void`
- `onLoadMore: () => void`
- `hasMore: boolean`
- `loadingMore: boolean`

## UI 细节

### FilterTabs

- 类型值：`'all' | 'like' | 'comment' | 'follow' | 'favorite'`
- 本地 state `activeFilter`，不影响服务端数据
- 角标：`notifications.filter(n => !n.isRead && (filter === 'all' || n.type === filter)).length`

### 未读角标（导航）

- 在传递给导航组件的 props 里加 `unreadCount: number`
- 样式复用 `.notification-unread-dot`，绝对定位于导航图标右上角

### 动画

- 给 `.notification-page-card` 加 `animation: notif-in 250ms ease`
- `@keyframes notif-in { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:none } }`

### 无限滚动

- 使用 `IntersectionObserver` 监听列表底部哨兵 div
- 进入视口且 `hasMore && !loadingMore` 时触发 `onLoadMore`
