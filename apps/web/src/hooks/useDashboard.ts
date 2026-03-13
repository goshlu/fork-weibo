import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

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
  UserProfile,
  ViewMode,
} from '../types/app';

type BusyState = '' | 'auth' | 'composer' | `like:${string}` | `follow:${string}` | `comment:${string}` | 'notifications';

type DashboardState = {
  authForm: AuthFormState;
  authMode: AuthMode;
  busy: BusyState;
  channels: Channel[];
  commentDrafts: Record<string, string>;
  commentsByPost: Record<string, Comment[]>;
  composer: ComposerState;
  currentUser: User | null;
  drafts: Post[];
  expandedComments: Record<string, boolean>;
  feedMode: FeedMode;
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  message: string;
  notifications: Notification[];
  posts: Post[];
  profile: UserProfile | null;
  profilePosts: Post[];
  searchInput: string;
  searchKeyword: string;
  searchResults: Post[];
  searchTrends: SearchTrend[];
  token: string;
  topics: Topic[];
  viewMode: ViewMode;
};

type DashboardActions = {
  logout: () => void;
  markNotificationsRead: () => Promise<void>;
  setAuthForm: Dispatch<SetStateAction<AuthFormState>>;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  setCommentDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setComposer: Dispatch<SetStateAction<ComposerState>>;
  setFeedMode: Dispatch<SetStateAction<FeedMode>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  submitAuth: () => Promise<void>;
  submitComment: (postId: string) => Promise<void>;
  submitComposer: () => Promise<void>;
  toggleComments: (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
};

export type DashboardReturn = {
  state: DashboardState;
  actions: DashboardActions;
};

const TOKEN_KEY = 'fork-weibo-token';
const USER_KEY = 'fork-weibo-user';

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function useDashboard(): DashboardReturn {
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem(TOKEN_KEY) ?? ''));
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<Record<string, boolean>>({});
  const [followingAuthorIds, setFollowingAuthorIds] = useState<Record<string, boolean>>({});
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [feedMode, setFeedMode] = useState<FeedMode>('hot');
  const [busy, setBusy] = useState<BusyState>('');
  const [message, setMessage] = useState('');
  const [authForm, setAuthForm] = useState<AuthFormState>({ username: '', password: '', nickname: '' });
  const [composer, setComposer] = useState<ComposerState>({ content: '', status: 'published' });

  useEffect(() => {
    void loadDiscovery();
  }, []);

  useEffect(() => {
    void loadFeed(feedMode, token || undefined);
  }, [feedMode, token]);

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setSearchResults([]);
      return;
    }

    void (async () => {
      try {
        const data = await api.search(searchKeyword.trim());
        setSearchResults(data.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Search failed.');
      }
    })();
  }, [searchKeyword]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setProfilePosts([]);
      setDrafts([]);
      setNotifications([]);
      return;
    }

    void refreshAuthedData(token);
  }, [token]);

  async function loadDiscovery() {
    try {
      const [topicData, trendData, channelData] = await Promise.all([
        api.getTopics(),
        api.getSearchTrends(),
        api.getChannels(),
      ]);
      setTopics(topicData.items);
      setSearchTrends(trendData.items);
      setChannels(channelData.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Discovery load failed.');
    }
  }

  async function loadFeed(mode: FeedMode, activeToken?: string) {
    try {
      const data = await api.getFeed(mode, activeToken);
      setPosts(data.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Feed load failed.');
    }
  }

  async function refreshAuthedData(activeToken: string) {
    try {
      const meData = await api.getMyUser(activeToken);
      const me = meData.user;
      setCurrentUser(me);
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(me));

      const [profileData, profilePostsData, draftsData, notificationsData] = await Promise.all([
        api.getProfile(me.id),
        api.getPosts({ authorId: me.id, status: 'published', pageSize: 20 }, activeToken),
        api.getPosts({ authorId: me.id, status: 'draft', pageSize: 20 }, activeToken),
        api.getNotifications(activeToken),
      ]);

      setProfile(profileData.profile);
      setProfilePosts(profilePostsData.items);
      setDrafts(draftsData.items);
      setNotifications(notificationsData.notifications);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Session refresh failed.');
    }
  }

  function logout() {
    setToken('');
    setCurrentUser(null);
    setProfile(null);
    setProfilePosts([]);
    setDrafts([]);
    setNotifications([]);
    setLikedPostIds({});
    setFollowingAuthorIds({});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    setMessage('Signed out.');
  }

  async function submitAuth() {
    setBusy('auth');
    setMessage('');
    try {
      const payload = authMode === 'login'
        ? await api.login({ username: authForm.username, password: authForm.password })
        : await api.register({ username: authForm.username, password: authForm.password, nickname: authForm.nickname });

      setToken(payload.token);
      setCurrentUser(payload.user);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOKEN_KEY, payload.token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
      }
      setAuthForm({ username: '', password: '', nickname: '' });
      setViewMode('profile');
      setMessage(authMode === 'login' ? 'Logged in.' : 'Account created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
    } finally {
      setBusy('');
    }
  }

  async function submitComposer() {
    if (!token) {
      setMessage('Log in before posting.');
      return;
    }
    if (!composer.content.trim()) {
      setMessage('Post content cannot be empty.');
      return;
    }

    setBusy('composer');
    setMessage('');
    try {
      await api.createPost({ content: composer.content.trim(), status: composer.status }, token);
      setComposer({ content: '', status: 'published' });
      setMessage(composer.status === 'draft' ? 'Draft saved.' : 'Post published.');
      await Promise.all([loadFeed(feedMode, token), refreshAuthedData(token), loadDiscovery()]);
      setViewMode(composer.status === 'draft' ? 'drafts' : 'feed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to submit post.');
    } finally {
      setBusy('');
    }
  }

  async function toggleLike(postId: string) {
    if (!token) {
      setMessage('Log in before liking a post.');
      return;
    }

    const liked = likedPostIds[postId] ?? false;
    setBusy(`like:${postId}`);
    try {
      await api.likePost(postId, liked, token);
      setLikedPostIds((prev) => ({ ...prev, [postId]: !liked }));
      await Promise.all([loadFeed(feedMode, token), refreshAuthedData(token)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update like.');
    } finally {
      setBusy('');
    }
  }

  async function toggleFollow(authorId: string) {
    if (!token) {
      setMessage('Log in before following users.');
      return;
    }
    if (authorId === currentUser?.id) {
      setMessage('You cannot follow yourself.');
      return;
    }

    const followed = followingAuthorIds[authorId] ?? false;
    setBusy(`follow:${authorId}`);
    try {
      await api.followAuthor(authorId, followed, token);
      setFollowingAuthorIds((prev) => ({ ...prev, [authorId]: !followed }));
      await refreshAuthedData(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update follow state.');
    } finally {
      setBusy('');
    }
  }

  async function toggleComments(postId: string) {
    const nextOpen = !(expandedComments[postId] ?? false);
    setExpandedComments((prev) => ({ ...prev, [postId]: nextOpen }));
    if (!nextOpen || commentsByPost[postId]) return;

    try {
      const data = await api.getComments(postId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: data.comments }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load comments.');
    }
  }

  async function submitComment(postId: string) {
    if (!token) {
      setMessage('Log in before commenting.');
      return;
    }

    const content = (commentDrafts[postId] ?? '').trim();
    if (!content) {
      setMessage('Comment cannot be empty.');
      return;
    }

    setBusy(`comment:${postId}`);
    try {
      const data = await api.createComment(postId, content, token);
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await refreshAuthedData(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create comment.');
    } finally {
      setBusy('');
    }
  }

  async function markNotificationsRead() {
    if (!token) {
      setMessage('Log in before managing notifications.');
      return;
    }

    setBusy('notifications');
    try {
      await api.markNotificationsRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to mark notifications as read.');
    } finally {
      setBusy('');
    }
  }

  return {
    state: {
      authForm,
      authMode,
      busy,
      channels,
      commentDrafts,
      commentsByPost,
      composer,
      currentUser,
      drafts,
      expandedComments,
      feedMode,
      followingAuthorIds,
      likedPostIds,
      message,
      notifications,
      posts,
      profile,
      profilePosts,
      searchInput,
      searchKeyword,
      searchResults,
      searchTrends,
      token,
      topics,
      viewMode,
    },
    actions: {
      logout,
      markNotificationsRead,
      setAuthForm,
      setAuthMode,
      setCommentDrafts,
      setComposer,
      setFeedMode,
      setSearchInput,
      setSearchKeyword,
      setViewMode,
      submitAuth,
      submitComment,
      submitComposer,
      toggleComments,
      toggleFollow,
      toggleLike,
    },
  };
}
