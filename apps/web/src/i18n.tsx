import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { FeedMode, ViewMode } from './types/app';

export type Locale = 'en' | 'zh';

export type Dictionary = {
  common: {
    language: string;
    chinese: string;
    english: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    yesterdayAt: string;
    someone: string;
  };
  sidebar: {
    title: string;
    description: string;
    workspace: string;
    unread: string;
    access: string;
    guestMode: string;
    login: string;
    register: string;
    username: string;
    password: string;
    nickname: string;
    authWorking: string;
    passwordPlaceholder: string;
    nicknamePlaceholder: string;
    session: string;
    online: string;
    logout: string;
    notifications: string;
    preview: string;
    markAllRead: string;
    noNotifications: string;
    markAsRead: string;
    unreadDotLabel: string;
    actionJumpToComment: string;
    actionViewPost: string;
    actionOpenProfile: string;
    typeLikes: string;
    typeSaves: string;
    typeReplies: string;
    typeFollows: string;
  };
  notifications: {
    center: string;
    allNotifications: string;
    inboxCleared: string;
    inboxDesc: string;
    loadingMore: string;
    noMore: string;
    groupToday: string;
    groupYesterday: string;
    groupEarlier: string;
    tabAll: string;
    tabLike: string;
    tabComment: string;
    tabFollow: string;
    tabFavorite: string;
  };
  feedPage: {
    contentSquare: string;
    addImages: string;
    sharePlaceholder: string;
    uploadLabel: string;
    remove: string;
    publishNow: string;
    saveDraft: string;
    submitting: string;
    submitPost: string;
    empty: string;
  };
  discovery: {
    title: string;
    placeholder: string;
    search: string;
    results: string;
    resultsEmpty: string;
    topics: string;
    hotSearches: string;
    channelMix: string;
  };
  drafts: {
    title: string;
    subtitle: string;
    draft: string;
    saving: string;
    save: string;
    publishing: string;
    publish: string;
    deleting: string;
    delete: string;
    empty: string;
  };
  profile: {
    profile: string;
    user: string;
    noBio: string;
    followers: string;
    following: string;
    posts: string;
    likes: string;
    loginRequired: string;
    avatar: string;
    avatarPreview: string;
    zoom: string;
    horizontal: string;
    vertical: string;
    uploadingAvatar: string;
    applyCroppedAvatar: string;
    cancel: string;
    nickname: string;
    bio: string;
    newPassword: string;
    keepPasswordHint: string;
    saving: string;
    saveProfile: string;
    libraryTitle: string;
    librarySubtitle: string;
    published: string;
    favorites: string;
    newFolderName: string;
    create: string;
    removeFromFolder: string;
    folderEmpty: string;
    publishedEmpty: string;
  };
  userPage: {
    notFound: string;
    userNoBio: string;
    publicPosts: string;
    postsCount: string;
    noPostsYet: string;
    following: string;
    follow: string;
    emptyPublished: string;
  };
  postPage: {
    notFound: string;
    detail: string;
    fallbackTitle: string;
  };
  postCard: {
    recommendedSimilarUsers: string;
    recommendedNetwork: string;
    popularNow: string;
    fromFollowingAuthors: string;
    trendingSquare: string;
    authorFallback: string;
    userFallback: string;
    replyingTo: string;
    reply: string;
    published: string;
    draft: string;
    postImageAlt: string;
    likesCount: string;
    commentsCount: string;
    savesCount: string;
    unlike: string;
    like: string;
    unfavorite: string;
    favorite: string;
    unfollow: string;
    followAuthor: string;
    viewDetails: string;
    hideComments: string;
    showComments: string;
    noComments: string;
    cancel: string;
    replyToPlaceholder: string;
    writeComment: string;
  };
  viewTitles: Record<ViewMode, string>;
  feedTitles: Record<FeedMode, string>;
};

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      language: 'Language',
      chinese: '中文',
      english: 'English',
      justNow: 'just now',
      minutesAgo: '{count}m ago',
      hoursAgo: '{count}h ago',
      daysAgo: '{count}d ago',
      yesterdayAt: 'Yesterday {time}',
      someone: 'Someone',
    },
    sidebar: {
      title: 'Social Dashboard',
      description: 'Service layer, state layer, and component layer are separated. Profile, drafts, and notifications are now first-class pages.',
      workspace: 'Workspace',
      unread: '{count} unread',
      access: 'Access',
      guestMode: 'Guest mode',
      login: 'Login',
      register: 'Register',
      username: 'Username',
      password: 'Password',
      nickname: 'Nickname',
      authWorking: 'Working...',
      passwordPlaceholder: 'At least 8 chars',
      nicknamePlaceholder: 'Display name',
      session: 'Session',
      online: 'Online',
      logout: 'Logout',
      notifications: 'Notifications',
      preview: 'Preview',
      markAllRead: 'Mark all read',
      noNotifications: 'No notifications yet.',
      markAsRead: 'Mark as read',
      unreadDotLabel: 'Unread',
      actionJumpToComment: 'Jump to comment',
      actionViewPost: 'View post',
      actionOpenProfile: 'Open profile',
      typeLikes: 'Likes',
      typeSaves: 'Saves',
      typeReplies: 'Replies',
      typeFollows: 'Follows',
    },
    notifications: {
      center: 'Notification Center',
      allNotifications: 'All notifications',
      inboxCleared: 'Inbox cleared.',
      inboxDesc: 'New likes, follows, comments, and favorites will appear here.',
      loadingMore: 'Loading more...',
      noMore: 'No more notifications',
      groupToday: 'Today',
      groupYesterday: 'Yesterday',
      groupEarlier: 'Earlier',
      tabAll: 'All',
      tabLike: 'Likes',
      tabComment: 'Comments',
      tabFollow: 'Follows',
      tabFavorite: 'Favorites',
    },
    feedPage: {
      contentSquare: 'Content Square',
      addImages: 'Add images',
      sharePlaceholder: 'Share something new. Try hashtags like #AI or #Travel',
      uploadLabel: 'Upload',
      remove: 'Remove',
      publishNow: 'Publish now',
      saveDraft: 'Save draft',
      submitting: 'Submitting...',
      submitPost: 'Submit post',
      empty: 'No posts in this feed yet.',
    },
    discovery: {
      title: 'Search and Discover',
      placeholder: 'Search keywords like ai or travel',
      search: 'Search',
      results: 'Search Results',
      resultsEmpty: 'Run a keyword search to populate this panel.',
      topics: 'Trending Topics',
      hotSearches: 'Hot Searches',
      channelMix: 'Channel Mix',
    },
    drafts: {
      title: 'Draft Box',
      subtitle: 'Unpublished content',
      draft: 'Draft',
      saving: 'Saving...',
      save: 'Save',
      publishing: 'Publishing...',
      publish: 'Publish',
      deleting: 'Deleting...',
      delete: 'Delete',
      empty: 'No drafts yet.',
    },
    profile: {
      profile: 'Profile',
      user: 'User',
      noBio: 'No bio yet.',
      followers: 'Followers',
      following: 'Following',
      posts: 'Posts',
      likes: 'Likes',
      loginRequired: 'Log in to view your profile.',
      avatar: 'Avatar',
      avatarPreview: 'Avatar preview',
      zoom: 'Zoom',
      horizontal: 'Horizontal',
      vertical: 'Vertical',
      uploadingAvatar: 'Uploading avatar...',
      applyCroppedAvatar: 'Apply cropped avatar',
      cancel: 'Cancel',
      nickname: 'Nickname',
      bio: 'Bio',
      newPassword: 'New password',
      keepPasswordHint: 'Leave blank to keep current password',
      saving: 'Saving...',
      saveProfile: 'Save profile',
      libraryTitle: 'Content Library',
      librarySubtitle: 'Switch folders to change what Favorite means across the app.',
      published: 'Published',
      favorites: 'Favorites',
      newFolderName: 'New folder name',
      create: 'Create',
      removeFromFolder: 'Remove from folder',
      folderEmpty: 'No favorites in this folder yet.',
      publishedEmpty: 'No published posts yet.',
    },
    userPage: {
      notFound: 'User not found.',
      userNoBio: 'This user has not added a bio yet.',
      publicPosts: 'Public Posts',
      postsCount: '{count} posts',
      noPostsYet: 'No posts yet',
      following: 'Following',
      follow: 'Follow',
      emptyPublished: 'This user has not published anything yet.',
    },
    postPage: {
      notFound: 'Post not found.',
      detail: 'Post Detail',
      fallbackTitle: 'Post',
    },
    postCard: {
      recommendedSimilarUsers: 'Recommended for similar users',
      recommendedNetwork: 'Recommended from your network',
      popularNow: 'Popular right now',
      fromFollowingAuthors: 'From authors you follow',
      trendingSquare: 'Trending in the square',
      authorFallback: 'Author',
      userFallback: 'User',
      replyingTo: 'Replying to {name}',
      reply: 'Reply',
      published: 'Published',
      draft: 'Draft',
      postImageAlt: 'Post image {index}',
      likesCount: '{count} likes',
      commentsCount: '{count} comments',
      savesCount: '{count} saves',
      unlike: 'Unlike',
      like: 'Like',
      unfavorite: 'Unfavorite',
      favorite: 'Favorite',
      unfollow: 'Unfollow',
      followAuthor: 'Follow author',
      viewDetails: 'View details',
      hideComments: 'Hide comments',
      showComments: 'Show comments',
      noComments: 'No comments yet.',
      cancel: 'Cancel',
      replyToPlaceholder: 'Reply to {name}',
      writeComment: 'Write a comment',
    },
    viewTitles: {
      feed: 'Feed',
      profile: 'Profile',
      drafts: 'Drafts',
      notifications: 'Notifications',
      user: 'User',
      post: 'Post',
    },
    feedTitles: {
      hot: 'Hot Feed',
      following: 'Following',
      recommended: 'Recommended',
    },
  },
  zh: {
    common: {
      language: '语言',
      chinese: '中文',
      english: 'English',
      justNow: '刚刚',
      minutesAgo: '{count}分钟前',
      hoursAgo: '{count}小时前',
      daysAgo: '{count}天前',
      yesterdayAt: '昨天 {time}',
      someone: '某人',
    },
    sidebar: {
      title: '社交控制台',
      description: '服务层、状态层与组件层已解耦，个人主页、草稿与通知均为一级页面。',
      workspace: '工作区',
      unread: '{count}条未读',
      access: '访问',
      guestMode: '访客模式',
      login: '登录',
      register: '注册',
      username: '用户名',
      password: '密码',
      nickname: '昵称',
      authWorking: '处理中...',
      passwordPlaceholder: '至少 8 位',
      nicknamePlaceholder: '显示名称',
      session: '会话',
      online: '在线',
      logout: '退出登录',
      notifications: '通知',
      preview: '预览',
      markAllRead: '全部已读',
      noNotifications: '暂无通知。',
      markAsRead: '标记为已读',
      unreadDotLabel: '未读',
      actionJumpToComment: '跳转评论',
      actionViewPost: '查看帖子',
      actionOpenProfile: '打开主页',
      typeLikes: '点赞',
      typeSaves: '收藏',
      typeReplies: '评论',
      typeFollows: '关注',
    },
    notifications: {
      center: '通知中心',
      allNotifications: '全部通知',
      inboxCleared: '收件箱已清空。',
      inboxDesc: '新的点赞、关注、评论和收藏会显示在这里。',
      loadingMore: '加载更多中...',
      noMore: '没有更多通知',
      groupToday: '今天',
      groupYesterday: '昨天',
      groupEarlier: '更早',
      tabAll: '全部',
      tabLike: '点赞',
      tabComment: '评论',
      tabFollow: '关注',
      tabFavorite: '收藏',
    },
    feedPage: {
      contentSquare: '内容广场',
      addImages: '添加图片',
      sharePlaceholder: '分享点新内容，例如 #AI 或 #旅行',
      uploadLabel: '上传',
      remove: '移除',
      publishNow: '立即发布',
      saveDraft: '保存草稿',
      submitting: '提交中...',
      submitPost: '发布帖子',
      empty: '当前流中还没有帖子。',
    },
    discovery: {
      title: '搜索与发现',
      placeholder: '输入关键词，如 ai 或 travel',
      search: '搜索',
      results: '搜索结果',
      resultsEmpty: '先搜索一个关键词，结果会显示在这里。',
      topics: '热门话题',
      hotSearches: '热搜词',
      channelMix: '频道分布',
    },
    drafts: {
      title: '草稿箱',
      subtitle: '未发布内容',
      draft: '草稿',
      saving: '保存中...',
      save: '保存',
      publishing: '发布中...',
      publish: '发布',
      deleting: '删除中...',
      delete: '删除',
      empty: '暂无草稿。',
    },
    profile: {
      profile: '个人主页',
      user: '用户',
      noBio: '暂无简介。',
      followers: '粉丝',
      following: '关注',
      posts: '帖子',
      likes: '获赞',
      loginRequired: '请先登录查看个人主页。',
      avatar: '头像',
      avatarPreview: '头像预览',
      zoom: '缩放',
      horizontal: '水平',
      vertical: '垂直',
      uploadingAvatar: '头像上传中...',
      applyCroppedAvatar: '应用裁剪头像',
      cancel: '取消',
      nickname: '昵称',
      bio: '简介',
      newPassword: '新密码',
      keepPasswordHint: '留空表示保持当前密码',
      saving: '保存中...',
      saveProfile: '保存资料',
      libraryTitle: '内容库',
      librarySubtitle: '切换收藏夹可以改变全局的收藏目标。',
      published: '已发布',
      favorites: '收藏',
      newFolderName: '新建文件夹名称',
      create: '创建',
      removeFromFolder: '从文件夹移除',
      folderEmpty: '该文件夹暂无收藏。',
      publishedEmpty: '还没有已发布内容。',
    },
    userPage: {
      notFound: '用户不存在。',
      userNoBio: '这个用户还没有填写简介。',
      publicPosts: '公开帖子',
      postsCount: '{count} 条帖子',
      noPostsYet: '还没有帖子',
      following: '已关注',
      follow: '关注',
      emptyPublished: '该用户还没有发布任何内容。',
    },
    postPage: {
      notFound: '帖子不存在。',
      detail: '帖子详情',
      fallbackTitle: '帖子',
    },
    postCard: {
      recommendedSimilarUsers: '基于相似用户推荐',
      recommendedNetwork: '来自你的社交网络推荐',
      popularNow: '当前热门',
      fromFollowingAuthors: '来自你关注的作者',
      trendingSquare: '广场热议',
      authorFallback: '作者',
      userFallback: '用户',
      replyingTo: '回复 {name}',
      reply: '回复',
      published: '已发布',
      draft: '草稿',
      postImageAlt: '帖子图片 {index}',
      likesCount: '{count} 次点赞',
      commentsCount: '{count} 条评论',
      savesCount: '{count} 次收藏',
      unlike: '取消点赞',
      like: '点赞',
      unfavorite: '取消收藏',
      favorite: '收藏',
      unfollow: '取消关注',
      followAuthor: '关注作者',
      viewDetails: '查看详情',
      hideComments: '收起评论',
      showComments: '展开评论',
      noComments: '暂无评论。',
      cancel: '取消',
      replyToPlaceholder: '回复 {name}',
      writeComment: '写下评论',
    },
    viewTitles: {
      feed: '动态',
      profile: '个人主页',
      drafts: '草稿',
      notifications: '通知',
      user: '用户',
      post: '帖子',
    },
    feedTitles: {
      hot: '热门',
      following: '关注中',
      recommended: '推荐',
    },
  },
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dictionary: Dictionary;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => undefined,
  dictionary: dictionaries.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('fork_weibo_locale');
    return saved === 'zh' || saved === 'en' ? saved : 'en';
  });

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem('fork_weibo_locale', next);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    dictionary: dictionaries[locale],
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

export function formatTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}
