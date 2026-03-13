import { useEffect, useState } from 'react';

import { api } from '../services/api';
import type {
  AuthFormState,
  AuthMode,
  Channel,
  Comment,
  ComposerState,
  FeedMode,
  Notification,
  Post,
  SearchTrend,
  Topic,
  User,
} from '../types/app';

export function useDashboard() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [feedMode, setFeedMode] = useState<FeedMode>('hot');
  const [posts, setPosts] = useState<Post[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('ai');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [followingAuthorIds, setFollowingAuthorIds] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [authForm, setAuthForm] = useState<AuthFormState>({
    username: '',
    password: '',
    nickname: '',
  });
  const [composer, setComposer] = useState<ComposerState>({ content: '', status: 'published' });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    void loadDiscovery();
  }, []);

  useEffect(() => {
    void loadFeed(feedMode);
  }, [feedMode, token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    void loadNotifications();
  }, [token]);

  useEffect(() => {
    if (!searchKeyword) {
      setSearchResults([]);
      return;
    }
    void searchPosts(searchKeyword);
  }, [searchKeyword]);

  async function loadFeed(mode: FeedMode) {
    try {
      const data = await api.getFeed(mode, token || undefined);
      setPosts(data.items);
    } catch (error) {
      if (mode !== 'hot') {
        setPosts([]);
      }
      setMessage(error instanceof Error ? error.message : '加载信息流失败');
    }
  }

  async function loadDiscovery() {
    try {
      const [topicsData, searchesData, channelsData] = await Promise.all([
        api.getTopics(),
        api.getSearchTrends(),
        api.getChannels(),
      ]);
      setTopics(topicsData.items);
      setSearchTrends(searchesData.items);
      setChannels(channelsData.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载发现页失败');
    }
  }

  async function loadNotifications() {
    if (!token) {
      return;
    }
    try {
      const data = await api.getNotifications(token);
      setNotifications(data.notifications);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载通知失败');
    }
  }

  async function loadComments(postId: string) {
    try {
      const data = await api.getComments(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载评论失败');
    }
  }

  async function searchPosts(keyword: string) {
    try {
      const data = await api.search(keyword);
      setSearchResults(data.items);
      void loadDiscovery();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '搜索失败');
    }
  }

  async function submitAuth() {
    setBusy('auth');
    setMessage('');
    try {
      const data =
        authMode === 'login'
          ? await api.login({ username: authForm.username, password: authForm.password })
          : await api.register({
              username: authForm.username,
              password: authForm.password,
              nickname: authForm.nickname || authForm.username,
            });
      setToken(data.token);
      setCurrentUser(data.user);
      setMessage(`${authMode === 'login' ? '登录' : '注册'}成功`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '认证失败');
    } finally {
      setBusy('');
    }
  }

  async function submitComposer() {
    if (!token) {
      setMessage('请先登录后再发帖');
      return;
    }
    setBusy('composer');
    setMessage('');
    try {
      await api.createPost(composer, token);
      setComposer({ content: '', status: 'published' });
      setMessage('内容已提交');
      void loadFeed(feedMode);
      void loadDiscovery();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    } finally {
      setBusy('');
    }
  }

  async function toggleLike(postId: string) {
    if (!token) {
      setMessage('请先登录后再点赞');
      return;
    }
    const liked = likedPostIds[postId] ?? false;
    setBusy(`like:${postId}`);
    setMessage('');
    try {
      await api.likePost(postId, liked, token);
      setLikedPostIds((prev) => ({ ...prev, [postId]: !liked }));
      void loadNotifications();
      void loadFeed(feedMode);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '点赞操作失败');
    } finally {
      setBusy('');
    }
  }

  async function toggleFollow(authorId: string) {
    if (!token || !currentUser) {
      setMessage('请先登录后再关注');
      return;
    }
    if (authorId === currentUser.id) {
      setMessage('不能关注自己');
      return;
    }
    const followed = followingAuthorIds[authorId] ?? false;
    setBusy(`follow:${authorId}`);
    setMessage('');
    try {
      await api.followAuthor(authorId, followed, token);
      setFollowingAuthorIds((prev) => ({ ...prev, [authorId]: !followed }));
      void loadNotifications();
      if (feedMode === 'following') {
        void loadFeed(feedMode);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '关注操作失败');
    } finally {
      setBusy('');
    }
  }

  async function submitComment(postId: string) {
    if (!token) {
      setMessage('请先登录后再评论');
      return;
    }
    const content = commentDrafts[postId]?.trim();
    if (!content) {
      setMessage('评论内容不能为空');
      return;
    }
    setBusy(`comment:${postId}`);
    setMessage('');
    try {
      await api.createComment(postId, content, token);
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
      void loadNotifications();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '评论失败');
    } finally {
      setBusy('');
    }
  }

  async function markNotificationsRead() {
    if (!token) {
      return;
    }
    try {
      await api.markNotificationsRead(token);
      await loadNotifications();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '标记已读失败');
    }
  }

  function toggleComments(postId: string) {
    const next = !(expandedComments[postId] ?? false);
    setExpandedComments((prev) => ({ ...prev, [postId]: next }));
    if (next && !commentsByPost[postId]) {
      void loadComments(postId);
    }
  }

  function logout() {
    setToken('');
    setCurrentUser(null);
    setNotifications([]);
    setLikedPostIds({});
    setFollowingAuthorIds({});
    setFeedMode('hot');
  }

  return {
    state: {
      authMode,
      token,
      currentUser,
      feedMode,
      posts,
      topics,
      searchTrends,
      channels,
      searchResults,
      searchKeyword,
      searchInput,
      notifications,
      likedPostIds,
      followingAuthorIds,
      commentsByPost,
      commentDrafts,
      expandedComments,
      authForm,
      composer,
      busy,
      message,
    },
    actions: {
      setAuthMode,
      setFeedMode,
      setSearchKeyword,
      setSearchInput,
      setAuthForm,
      setComposer,
      setCommentDrafts,
      submitAuth,
      submitComposer,
      toggleLike,
      toggleFollow,
      submitComment,
      toggleComments,
      markNotificationsRead,
      logout,
    },
  };
}
