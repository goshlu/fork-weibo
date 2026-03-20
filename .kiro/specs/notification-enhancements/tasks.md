# Notification Enhancements — Tasks

## Task 1: 单条标记已读

- [x] `apps/web/src/hooks/useDashboard.ts` — 新增 `markOneNotificationRead(id)` 函数，调用 API 或乐观更新 isRead
- [x] `apps/web/src/components/pages/NotificationsPage.tsx` — props 加 `onMarkOneRead`，卡片右上角渲染"已读"按钮（仅 `!item.isRead` 时显示）
- [x] `apps/web/src/styles.css` — 添加 `.notification-mark-read-btn` 样式（小图标按钮，绝对定位右上角）

## Task 2: 通知类型筛选 Tab

- [x] `NotificationsPage.tsx` — 新增本地 state `activeFilter`，渲染 `<FilterTabs>` 组件
- [x] 新建 `apps/web/src/components/ui/FilterTabs.tsx` — 接收 tabs 配置 + activeFilter + onChange，渲染 tab 列表
- [x] `NotificationsPage.tsx` — `groupNotificationsByDate` 调用前先按 `activeFilter` 过滤 notifications
- [x] `styles.css` — 添加 `.filter-tabs`、`.filter-tab`、`.filter-tab.active`、`.filter-tab-badge` 样式

## Task 3: 导航入口未读角标

- [x] 找到侧边栏 / 底部导航渲染通知入口的组件，传入 `unreadCount`
- [x] 在通知导航项上叠加 `.nav-unread-badge`，值为 `unreadCount`，为 0 时 `display:none`
- [x] `styles.css` — 添加 `.nav-unread-badge` 样式（复用 unread-dot 颜色，最小宽度适配两位数）

## Task 4: 新通知淡入动画

- [x] `styles.css` — 添加 `@keyframes notif-in` 及 `.notification-page-card { animation: notif-in 250ms ease }`

## Task 5: 分页 / 无限滚动

- [x] `useDashboard.ts` — 新增 `notificationPage`、`notificationHasMore`、`loadingMore` 状态；`loadMoreNotifications()` 追加下一页数据
- [x] `NotificationsPage.tsx` — props 加 `onLoadMore`、`hasMore`、`loadingMore`；列表底部渲染哨兵 `<div ref={sentinelRef} />`
- [x] `NotificationsPage.tsx` — `useEffect` 内用 `IntersectionObserver` 监听哨兵，触发 `onLoadMore`
- [x] `styles.css` — 添加 `.notification-load-more-spinner` 和 `.notification-no-more` 样式
