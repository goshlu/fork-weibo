import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { api } from '../services/api';
import { useI18n, formatTemplate } from '../i18n';
import type {
  AuthFormState,
  AuthMode,
  Channel,
  Comment,
  ComposerState,
  FavoriteItem,
  FeedMode,
  Notification,
  Post,
  ProfileFormState,
  SearchTrend,
  Topic,
  User,
  UserProfile,
  ViewMode,
} from '../types/app';

type BusyState =
  | ''
  | 'auth'
  | 'composer'
  | 'profile'
  | 'avatar'
  | `like:${string}`
  | `favorite:${string}`
  | `follow:${string}`
  | `comment:${string}`
  | `draft-save:${string}`
  | `draft-publish:${string}`
  | `draft-delete:${string}`
  | 'notifications';

type DashboardState = {
  authForm: AuthFormState;
  authMode: AuthMode;
  avatarPreview: string;
  busy: BusyState;
  channels: Channel[];
  commentDrafts: Record<string, string>;
  commentsByPost: Record<string, Comment[]>;
  composer: ComposerState;
  currentUser: User | null;
  draftEdits: Record<string, string>;
  drafts: Post[];
  expandedComments: Record<string, boolean>;
  favoriteFolderName: string;
  favoritePostIds: Record<string, boolean>;
  favorites: FavoriteItem[];
  feedMode: FeedMode;
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  message: string;
  notifications: Notification[];
  notificationPage: number;
  notificationHasMore: boolean;
  loadingMore: boolean;
  postDetail: Post | null;
  postDetailHighlightCommentId: string;
  posts: Post[];
  profile: UserProfile | null;
  profileForm: ProfileFormState;
  profilePosts: Post[];
  viewedProfile: UserProfile | null;
  viewedUserId: string;
  viewedUserPosts: Post[];
  searchInput: string;
  searchKeyword: string;
  searchResults: Post[];
  searchTrends: SearchTrend[];
  token: string;
  topics: Topic[];
  viewMode: ViewMode;
};

type DashboardActions = {
  deleteDraft: (postId: string) => Promise<void>;
  logout: () => void;
  markNotificationsRead: () => Promise<void>;
  markOneNotificationRead: (id: string) => Promise<void>;
  openNotification: (notification: Notification) => Promise<void>;
  openPostDetail: (postId: string, highlightedCommentId?: string) => Promise<void>;
  openUserProfile: (userId: string) => Promise<void>;
  publishDraft: (postId: string) => Promise<void>;
  saveDraft: (postId: string) => Promise<void>;
  saveProfile: () => Promise<void>;
  setAuthForm: Dispatch<SetStateAction<AuthFormState>>;
  setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  setAvatarPreview: Dispatch<SetStateAction<string>>;
  setCommentDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setComposer: Dispatch<SetStateAction<ComposerState>>;
  setDraftEdits: Dispatch<SetStateAction<Record<string, string>>>;
  setFavoriteFolderName: Dispatch<SetStateAction<string>>;
  setFeedMode: Dispatch<SetStateAction<FeedMode>>;
  setProfileForm: Dispatch<SetStateAction<ProfileFormState>>;
  setSearchInput: Dispatch<SetStateAction<string>>;
  setSearchKeyword: Dispatch<SetStateAction<string>>;
  setViewMode: Dispatch<SetStateAction<ViewMode>>;
  submitAuth: () => Promise<void>;
  submitComment: (postId: string, parentId?: string) => Promise<void>;
  submitComposer: () => Promise<void>;
  toggleComments: (postId: string) => Promise<void>;
  toggleFavorite: (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
};

export type DashboardReturn = {
  state: DashboardState;
  actions: DashboardActions;
};

const TOKEN_KEY = 'fork-weibo-token';
const USER_KEY = 'fork-weibo-user';
const DEFAULT_FAVORITE_FOLDER = 'default';
const NOTIFICATIONS_PAGE_SIZE = 20;

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

function buildFavoriteMap(items: FavoriteItem[], folderName: string): Record<string, boolean> {
  return Object.fromEntries(
    items
      .filter((item) => item.folderName === folderName)
      .map((item) => [item.postId, true]),
  );
}

function buildViewerMaps(posts: Post[]): { liked: Record<string, boolean>; following: Record<string, boolean> } {
  return posts.reduce(
    (acc, post) => {
      if (post.viewer?.hasLiked !== undefined) acc.liked[post.id] = post.viewer.hasLiked;
      if (post.viewer?.isFollowingAuthor !== undefined) acc.following[post.authorId] = post.viewer.isFollowingAuthor;
      return acc;
    },
    { liked: {} as Record<string, boolean>, following: {} as Record<string, boolean> },
  );
}

function mergeNotificationPages(current: Notification[], incoming: Notification[]): Notification[] {
  const merged = [...current];
  const indexById = new Map(merged.map((item, index) => [item.id, index]));

  for (const item of incoming) {
    const existingIndex = indexById.get(item.id);
    if (existingIndex === undefined) {
      indexById.set(item.id, merged.length);
      merged.push(item);
      continue;
    }

    merged[existingIndex] = item;
  }

  return merged;
}

export function useDashboard(): DashboardReturn {
  const { dictionary } = useI18n();
  const t = dictionary.messages;
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem(TOKEN_KEY) ?? ''));
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ nickname: '', bio: '', password: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [viewedUserId, setViewedUserId] = useState('');
  const [viewedUserPosts, setViewedUserPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteFolderName, setFavoriteFolderName] = useState(DEFAULT_FAVORITE_FOLDER);
  const [favoritePostIds, setFavoritePostIds] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationHasMore, setNotificationHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postDetail, setPostDetail] = useState<Post | null>(null);
  const [postDetailHighlightCommentId, setPostDetailHighlightCommentId] = useState('');
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
  const [composer, setComposer] = useState<ComposerState>({ content: '', status: 'published', images: [] });

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
        setMessage(error instanceof Error ? error.message : t.searchFailed);
      }
    })();
  }, [searchKeyword]);

  useEffect(() => {
    const activeFolder = favoriteFolderName.trim() || DEFAULT_FAVORITE_FOLDER;
    setFavoritePostIds(buildFavoriteMap(favorites, activeFolder));
  }, [favoriteFolderName, favorites]);

  useEffect(() => {
    if (!token) {
      setProfile(null);
      setProfilePosts([]);
      setViewedProfile(null);
      setViewedUserId('');
      setViewedUserPosts([]);
      setDrafts([]);
      setFavorites([]);
      setFavoritePostIds({});
      setNotifications([]);
      setNotificationPage(1);
      setNotificationHasMore(true);
      setLoadingMore(false);
      setPostDetail(null);
      setPostDetailHighlightCommentId('');
      setProfileForm({ nickname: '', bio: '', password: '' });
      setAvatarPreview('');
      return;
    }

    void refreshAuthedData(token);
  }, [token]);

  useEffect(() => {
    if (!token || viewMode !== 'notifications') {
      return;
    }

    void (async () => {
      try {
        const data = await api.getNotifications(token, { page: 1, pageSize: NOTIFICATIONS_PAGE_SIZE });
        setNotifications(data.items);
        setNotificationPage(data.page);
        setNotificationHasMore(data.hasMore);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : t.loadMoreNotificationsFailed);
      }
    })();
  }, [token, viewMode, t.loadMoreNotificationsFailed]);

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
      setMessage(error instanceof Error ? error.message : t.discoveryFailed);
    }
  }

  async function loadFeed(mode: FeedMode, activeToken?: string) {
    try {
      const data = await api.getFeed(mode, activeToken);
      setPosts(data.items);
      if (activeToken) {
        const viewerMaps = buildViewerMaps(data.items);
        setLikedPostIds((prev) => ({ ...prev, ...viewerMaps.liked }));
        setFollowingAuthorIds((prev) => ({ ...prev, ...viewerMaps.following }));
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.feedFailed);
    }
  }

  async function refreshAuthedData(activeToken: string) {
    try {
      const meData = await api.getMyUser(activeToken);
      const me = meData.user;
      setCurrentUser(me);
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(me));

      const [profileData, profilePostsData, draftsData, notificationsData, favoritesData] = await Promise.all([
        api.getProfile(me.id),
        api.getPosts({ authorId: me.id, status: 'published', pageSize: 20 }, activeToken),
        api.getPosts({ authorId: me.id, status: 'draft', pageSize: 20 }, activeToken),
        api.getNotifications(activeToken, { page: 1, pageSize: NOTIFICATIONS_PAGE_SIZE }),
        api.getFavorites(activeToken),
      ]);

      setProfile(profileData.profile);
      setProfileForm({
        nickname: profileData.profile.nickname,
        bio: profileData.profile.bio,
        password: '',
      });
      setAvatarPreview(profileData.profile.avatarUrl ? `${apiBase(profileData.profile.avatarUrl)}` : '');
      setProfilePosts(profilePostsData.items);
      setDrafts(draftsData.items);
      const viewerMaps = buildViewerMaps([
        ...profilePostsData.items,
        ...draftsData.items,
        ...favoritesData.items.map((item) => item.post),
      ]);
      setLikedPostIds((prev) => ({ ...prev, ...viewerMaps.liked }));
      setFollowingAuthorIds((prev) => ({ ...prev, ...viewerMaps.following }));
      setDraftEdits(Object.fromEntries(draftsData.items.map((item) => [item.id, item.content])));
      setNotifications(notificationsData.items);
      setNotificationPage(notificationsData.page);
      setNotificationHasMore(notificationsData.hasMore);
      setLoadingMore(false);
      setFavorites(favoritesData.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.sessionFailed);
    }
  }

  function apiBase(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
  }

  function logout() {
    setToken('');
    setCurrentUser(null);
    setProfile(null);
    setProfilePosts([]);
    setViewedProfile(null);
    setViewedUserId('');
    setViewedUserPosts([]);
    setDrafts([]);
    setDraftEdits({});
    setFavorites([]);
    setFavoritePostIds({});
    setNotifications([]);
    setNotificationPage(1);
    setNotificationHasMore(true);
    setLoadingMore(false);
    setPostDetail(null);
    setPostDetailHighlightCommentId('');
    setLikedPostIds({});
    setFollowingAuthorIds({});
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    setMessage(t.signedOut);
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
      setMessage(authMode === 'login' ? t.loggedIn : t.accountCreated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.authFailed);
    } finally {
      setBusy('');
    }
  }

  async function submitComposer() {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }
    if (!composer.content.trim()) {
      setMessage(t.postEmpty);
      return;
    }

    setBusy('composer');
    setMessage('');
    try {
      await api.createPost({ content: composer.content.trim(), status: composer.status, images: composer.images }, token);
      setComposer({ content: '', status: 'published', images: [] });
      setMessage(composer.status === 'draft' ? t.draftSaved : t.postPublished);
      await Promise.all([loadFeed(feedMode, token), refreshAuthedData(token), loadDiscovery()]);
      setViewMode(composer.status === 'draft' ? 'drafts' : 'feed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.postFailed);
    } finally {
      setBusy('');
    }
  }

  async function saveProfile() {
    if (!token || !profile || !currentUser) {
      setMessage(t.loginRequired);
      return;
    }

    const payload: { nickname?: string; bio?: string; password?: string } = {};
    if (profileForm.nickname.trim()) payload.nickname = profileForm.nickname.trim();
    payload.bio = profileForm.bio.trim();
    if (profileForm.password.trim()) payload.password = profileForm.password.trim();

    const previousProfile = profile;
    const previousUser = currentUser;
    const optimisticNickname = payload.nickname ?? profile.nickname;
    const optimisticBio = payload.bio ?? profile.bio;

    setBusy('profile');
    setProfile((prev) => (prev ? { ...prev, nickname: optimisticNickname, bio: optimisticBio } : prev));
    setCurrentUser((prev) => (prev ? { ...prev, nickname: optimisticNickname, bio: optimisticBio } : prev));
    if (typeof window !== 'undefined') {
      const nextStoredUser = { ...currentUser, nickname: optimisticNickname, bio: optimisticBio };
      window.localStorage.setItem(USER_KEY, JSON.stringify(nextStoredUser));
    }

    try {
      const data = await api.updateMyUser(payload, token);
      setCurrentUser(data.user);
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setProfile((prev) => (prev ? { ...prev, nickname: data.user.nickname, bio: data.user.bio, updatedAt: data.user.updatedAt } : prev));
      setProfileForm((prev) => ({ ...prev, nickname: data.user.nickname, bio: data.user.bio, password: '' }));
      setMessage(t.profileUpdated);
    } catch (error) {
      setProfile(previousProfile);
      setCurrentUser(previousUser);
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(previousUser));
      setMessage(error instanceof Error ? error.message : t.profileFailed);
    } finally {
      setBusy('');
    }
  }

  async function uploadAvatar(file: File) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    setBusy('avatar');
    try {
      const data = await api.uploadAvatar(file, token);
      setCurrentUser(data.user);
      setAvatarPreview(data.user.avatarUrl ? apiBase(data.user.avatarUrl) : '');
      setProfile((prev) => (prev ? { ...prev, avatarUrl: data.user.avatarUrl, updatedAt: data.user.updatedAt } : prev));
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setMessage(t.avatarUpdated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.avatarFailed);
    } finally {
      setBusy('');
    }
  }

  async function toggleLike(postId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    const liked = likedPostIds[postId] ?? false;
    setBusy(`like:${postId}`);
    try {
      await api.likePost(postId, liked, token);
      setLikedPostIds((prev) => ({ ...prev, [postId]: !liked }));
      await Promise.all([loadFeed(feedMode, token), refreshAuthedData(token)]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.likeFailed);
    } finally {
      setBusy('');
    }
  }

  async function toggleFavorite(postId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    const folderName = favoriteFolderName.trim() || DEFAULT_FAVORITE_FOLDER;
    const favorited = favoritePostIds[postId] ?? false;
    setBusy(`favorite:${postId}`);
    try {
      await api.favoritePost(postId, favorited, token, folderName);
      await refreshAuthedData(token);
      setMessage(favorited ? formatTemplate(t.removedFromFolder, { folder: folderName }) : formatTemplate(t.savedToFolder, { folder: folderName }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.favoriteFailed);
    } finally {
      setBusy('');
    }
  }

  async function toggleFollow(authorId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }
    if (authorId === currentUser?.id) {
      setMessage(t.cannotFollowSelf);
      return;
    }

    const followed = followingAuthorIds[authorId] ?? false;
    setBusy(`follow:${authorId}`);
    try {
      await api.followAuthor(authorId, followed, token);
      setFollowingAuthorIds((prev) => ({ ...prev, [authorId]: !followed }));
      await refreshAuthedData(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.followFailed);
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
      setMessage(error instanceof Error ? error.message : t.commentsFailed);
    }
  }

  async function submitComment(postId: string, parentId?: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    const content = (commentDrafts[postId] ?? '').trim();
    if (!content) {
      setMessage(t.commentEmpty);
      return;
    }

    setBusy(`comment:${postId}`);
    try {
      const data = await api.createComment(postId, content, token, parentId);
      setCommentsByPost((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), data.comment] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      await refreshAuthedData(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.commentFailed);
    } finally {
      setBusy('');
    }
  }

  async function saveDraft(postId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    const content = (draftEdits[postId] ?? '').trim();
    if (!content) {
      setMessage(t.postEmpty);
      return;
    }

    setBusy(`draft-save:${postId}`);
    try {
      await api.updatePost(postId, { content, status: 'draft' }, token);
      await refreshAuthedData(token);
      setMessage(t.draftSaved);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.saveDraftFailed);
    } finally {
      setBusy('');
    }
  }

  async function publishDraft(postId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    const content = (draftEdits[postId] ?? '').trim();
    if (!content) {
      setMessage(t.postEmpty);
      return;
    }

    setBusy(`draft-publish:${postId}`);
    try {
      await api.updatePost(postId, { content, status: 'published' }, token);
      await Promise.all([refreshAuthedData(token), loadFeed(feedMode, token)]);
      setViewMode('profile');
      setMessage(t.draftPublished);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.publishDraftFailed);
    } finally {
      setBusy('');
    }
  }

  async function deleteDraft(postId: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    setBusy(`draft-delete:${postId}`);
    try {
      await api.deletePost(postId, token);
      await refreshAuthedData(token);
      setMessage(t.draftDeleted);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.deleteDraftFailed);
    } finally {
      setBusy('');
    }
  }

  async function openPostDetail(postId: string, highlightedCommentId = '') {
    try {
      const [postData, commentsData] = await Promise.all([
        api.getPost(postId, token || undefined),
        api.getComments(postId),
      ]);

      setPostDetail(postData.post);
      setCommentsByPost((prev) => ({ ...prev, [postId]: commentsData.comments }));
      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
      setPostDetailHighlightCommentId(highlightedCommentId);
      const viewerMaps = buildViewerMaps([postData.post]);
      setLikedPostIds((prev) => ({ ...prev, ...viewerMaps.liked }));
      setFollowingAuthorIds((prev) => ({ ...prev, ...viewerMaps.following }));
      setViewMode('post');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.postDetailFailed);
    }
  }
  async function openUserProfile(userId: string) {
    if (userId === currentUser?.id) {
      setViewMode('profile');
      return;
    }

    try {
      const [profileData, postsData] = await Promise.all([
        api.getProfile(userId),
        api.getPosts({ authorId: userId, status: 'published', pageSize: 20 }, token || undefined),
      ]);

      setViewedUserId(userId);
      setViewedProfile(profileData.profile);
      setViewedUserPosts(postsData.items);
      const viewerMaps = buildViewerMaps(postsData.items);
      setLikedPostIds((prev) => ({ ...prev, ...viewerMaps.liked }));
      setFollowingAuthorIds((prev) => ({ ...prev, ...viewerMaps.following }));
      setViewMode('user');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.userProfileFailed);
    }
  }
  async function openNotification(notification: Notification) {
    try {
      setNotifications((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      if (notification.entityType === 'user') {
        await openUserProfile(notification.entityId);
        return;
      }

      if (notification.entityType === 'post') {
        await openPostDetail(notification.entityId);
        return;
      }

      if (notification.entityType === 'comment') {
        const data = await api.getComment(notification.entityId);
        await openPostDetail(data.comment.postId, data.comment.id);
        return;
      }

      await openUserProfile(notification.actorId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.notificationTargetFailed);
    }
  }

  async function markNotificationsRead() {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    setBusy('notifications');
    try {
      await api.markNotificationsRead(token);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.notificationMarkFailed);
    } finally {
      setBusy('');
    }
  }

  async function markOneNotificationRead(id: string) {
    if (!token) {
      setMessage(t.loginRequired);
      return;
    }

    try {
      await api.markNotificationRead(id, token);
      setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, isRead: true } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.notificationMarkOneFailed);
    }
  }

  async function loadMoreNotifications() {
    if (!token || loadingMore || !notificationHasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = notificationPage + 1;
      const data = await api.getNotifications(token, { page: nextPage, pageSize: NOTIFICATIONS_PAGE_SIZE });
      setNotifications((prev) => mergeNotificationPages(prev, data.items));
      setNotificationPage(data.page);
      setNotificationHasMore(data.hasMore);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.loadMoreNotificationsFailed);
    } finally {
      setLoadingMore(false);
    }
  }

  return {
    state: {
      authForm,
      authMode,
      avatarPreview,
      busy,
      channels,
      commentDrafts,
      commentsByPost,
      composer,
      currentUser,
      draftEdits,
      drafts,
      expandedComments,
      favoriteFolderName,
      favoritePostIds,
      favorites,
      feedMode,
      followingAuthorIds,
      likedPostIds,
      message,
      notifications,
      notificationPage,
      notificationHasMore,
      loadingMore,
      postDetail,
      postDetailHighlightCommentId,
      posts,
      profile,
      profileForm,
      profilePosts,
      viewedProfile,
      viewedUserId,
      viewedUserPosts,
      searchInput,
      searchKeyword,
      searchResults,
      searchTrends,
      token,
      topics,
      viewMode,
    },
    actions: {
      deleteDraft,
      logout,
      markNotificationsRead,
      markOneNotificationRead,
      openNotification,
      openPostDetail,
      openUserProfile,
      publishDraft,
      saveDraft,
      saveProfile,
      setAuthForm,
      setAuthMode,
      setAvatarPreview,
      setCommentDrafts,
      setComposer,
      setDraftEdits,
      setFavoriteFolderName,
      setFeedMode,
      setProfileForm,
      setSearchInput,
      setSearchKeyword,
      setViewMode,
      submitAuth,
      submitComment,
      submitComposer,
      toggleComments,
      toggleFavorite,
      toggleFollow,
      toggleLike,
      uploadAvatar,
      loadMoreNotifications,
    },
  };
}





