import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { api } from '../services/api';
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
  posts: Post[];
  profile: UserProfile | null;
  profileForm: ProfileFormState;
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
  deleteDraft: (postId: string) => Promise<void>;
  logout: () => void;
  markNotificationsRead: () => Promise<void>;
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
  submitComment: (postId: string) => Promise<void>;
  submitComposer: () => Promise<void>;
  toggleComments: (postId: string) => Promise<void>;
  toggleFavorite: (postId: string) => Promise<void>;
  toggleFollow: (authorId: string) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
};

export type DashboardReturn = {
  state: DashboardState;
  actions: DashboardActions;
};

const TOKEN_KEY = 'fork-weibo-token';
const USER_KEY = 'fork-weibo-user';
const DEFAULT_FAVORITE_FOLDER = 'default';

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

function buildFavoriteMap(items: FavoriteItem[]): Record<string, boolean> {
  return Object.fromEntries(items.map((item) => [item.postId, true]));
}

export function useDashboard(): DashboardReturn {
  const [token, setToken] = useState(() => (typeof window === 'undefined' ? '' : window.localStorage.getItem(TOKEN_KEY) ?? ''));
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredUser());
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({ nickname: '', bio: '', password: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [profilePosts, setProfilePosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [favoriteFolderName, setFavoriteFolderName] = useState(DEFAULT_FAVORITE_FOLDER);
  const [favoritePostIds, setFavoritePostIds] = useState<Record<string, boolean>>({});
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
      setFavorites([]);
      setFavoritePostIds({});
      setNotifications([]);
      setProfileForm({ nickname: '', bio: '', password: '' });
      setAvatarPreview('');
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

      const [profileData, profilePostsData, draftsData, notificationsData, favoritesData] = await Promise.all([
        api.getProfile(me.id),
        api.getPosts({ authorId: me.id, status: 'published', pageSize: 20 }, activeToken),
        api.getPosts({ authorId: me.id, status: 'draft', pageSize: 20 }, activeToken),
        api.getNotifications(activeToken),
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
      setDraftEdits(Object.fromEntries(draftsData.items.map((item) => [item.id, item.content])));
      setNotifications(notificationsData.notifications);
      setFavorites(favoritesData.items);
      setFavoritePostIds(buildFavoriteMap(favoritesData.items));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Session refresh failed.');
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
    setDrafts([]);
    setDraftEdits({});
    setFavorites([]);
    setFavoritePostIds({});
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

  async function saveProfile() {
    if (!token || !profile || !currentUser) {
      setMessage('Log in before editing profile.');
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
      setMessage('Profile updated.');
    } catch (error) {
      setProfile(previousProfile);
      setCurrentUser(previousUser);
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(previousUser));
      setMessage(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setBusy('');
    }
  }

  async function uploadAvatar(file: File) {
    if (!token) {
      setMessage('Log in before uploading an avatar.');
      return;
    }

    setBusy('avatar');
    try {
      const data = await api.uploadAvatar(file, token);
      setCurrentUser(data.user);
      setAvatarPreview(data.user.avatarUrl ? apiBase(data.user.avatarUrl) : '');
      setProfile((prev) => (prev ? { ...prev, avatarUrl: data.user.avatarUrl, updatedAt: data.user.updatedAt } : prev));
      if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setMessage('Avatar updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to upload avatar.');
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

  async function toggleFavorite(postId: string) {
    if (!token) {
      setMessage('Log in before favoriting a post.');
      return;
    }

    const favorited = favoritePostIds[postId] ?? false;
    const folderName = favoriteFolderName.trim() || DEFAULT_FAVORITE_FOLDER;
    setBusy(`favorite:${postId}`);
    try {
      await api.favoritePost(postId, favorited, token, folderName);
      await refreshAuthedData(token);
      setMessage(favorited ? 'Removed from favorites.' : `Saved to ${folderName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update favorite.');
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

  async function saveDraft(postId: string) {
    if (!token) {
      setMessage('Log in before editing drafts.');
      return;
    }

    const content = (draftEdits[postId] ?? '').trim();
    if (!content) {
      setMessage('Draft content cannot be empty.');
      return;
    }

    setBusy(`draft-save:${postId}`);
    try {
      await api.updatePost(postId, { content, status: 'draft' }, token);
      await refreshAuthedData(token);
      setMessage('Draft saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save draft.');
    } finally {
      setBusy('');
    }
  }

  async function publishDraft(postId: string) {
    if (!token) {
      setMessage('Log in before publishing drafts.');
      return;
    }

    const content = (draftEdits[postId] ?? '').trim();
    if (!content) {
      setMessage('Draft content cannot be empty.');
      return;
    }

    setBusy(`draft-publish:${postId}`);
    try {
      await api.updatePost(postId, { content, status: 'published' }, token);
      await Promise.all([refreshAuthedData(token), loadFeed(feedMode, token)]);
      setViewMode('profile');
      setMessage('Draft published.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to publish draft.');
    } finally {
      setBusy('');
    }
  }

  async function deleteDraft(postId: string) {
    if (!token) {
      setMessage('Log in before deleting drafts.');
      return;
    }

    setBusy(`draft-delete:${postId}`);
    try {
      await api.deletePost(postId, token);
      await refreshAuthedData(token);
      setMessage('Draft deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete draft.');
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
      posts,
      profile,
      profileForm,
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
      deleteDraft,
      logout,
      markNotificationsRead,
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
    },
  };
}
