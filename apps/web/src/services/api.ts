import type {
  Channel,
  Comment,
  ComposerState,
  FeedListResult,
  FavoriteItem,
  FeedMode,
  NotificationListResult,
  Post,
  SearchTrend,
  Topic,
  User,
  UserProfile,
} from '../types/app';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  login(payload: { username: string; password: string }) {
    return request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },
  register(payload: { username: string; password: string; nickname: string }) {
    return request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },
  createPost(payload: ComposerState, token: string) {
    if (payload.images.length) {
      const formData = new FormData();
      formData.append('content', payload.content);
      formData.append('status', payload.status);
      for (const image of payload.images) {
        formData.append('images', image);
      }
      return request<{ post: Post }>('/posts', { method: 'POST', body: formData }, token);
    }

    return request<{ post: Post }>(
      '/posts',
      { method: 'POST', body: JSON.stringify({ content: payload.content, status: payload.status }) },
      token,
    );
  },
  updatePost(postId: string, payload: Partial<Omit<ComposerState, 'images'>> & { content?: string }, token: string) {
    return request<{ post: Post }>(`/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  deletePost(postId: string, token: string) {
    return request<void>(`/posts/${postId}`, { method: 'DELETE' }, token);
  },
  getPost(postId: string, token?: string) {
    return request<{ post: Post }>(`/posts/${postId}`, {}, token);
  },
  getFeed(mode: FeedMode, token?: string, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 10));
    const path = mode === 'hot' ? '/feed/hot' : mode === 'following' ? '/feed/following' : '/feed/recommended';
    return request<FeedListResult>(`${path}?${query.toString()}`, {}, token);
  },
  getPosts(params: { pageSize?: number; authorId?: string; status?: 'draft' | 'published' }, token?: string) {
    const query = new URLSearchParams();
    query.set('page', '1');
    query.set('pageSize', String(params.pageSize ?? 20));
    if (params.authorId) query.set('authorId', params.authorId);
    if (params.status) query.set('status', params.status);
    return request<{ items: Post[] }>(`/posts?${query.toString()}`, {}, token);
  },
  getMyUser(token: string) {
    return request<{ user: User }>('/users/me', {}, token);
  },
  updateMyUser(payload: { nickname?: string; bio?: string; password?: string }, token: string) {
    return request<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) }, token);
  },
  uploadAvatar(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ user: User }>('/users/me/avatar', { method: 'POST', body: formData }, token);
  },
  getProfile(userId: string) {
    return request<{ profile: UserProfile }>(`/users/${userId}/profile`);
  },
  getFavorites(token: string) {
    return request<{ items: FavoriteItem[]; total: number }>('/favorites', {}, token);
  },
  search(keyword: string) {
    return request<{ items: Post[] }>(`/search?q=${encodeURIComponent(keyword)}&page=1&pageSize=8`);
  },
  getTopics() {
    return request<{ items: Topic[] }>('/discover/topics?page=1&pageSize=6');
  },
  getSearchTrends() {
    return request<{ items: SearchTrend[] }>('/discover/searches?page=1&pageSize=6');
  },
  getChannels() {
    return request<{ items: Channel[] }>('/discover/channels');
  },
  likePost(postId: string, liked: boolean, token: string) {
    return request(`/posts/${postId}/likes`, { method: liked ? 'DELETE' : 'POST' }, token);
  },
  favoritePost(postId: string, favorited: boolean, token: string, folderName = 'default') {
    return favorited
      ? request(`/posts/${postId}/favorites/${encodeURIComponent(folderName)}`, { method: 'DELETE' }, token)
      : request(`/posts/${postId}/favorites`, { method: 'POST', body: JSON.stringify({ folderName }) }, token);
  },
  followAuthor(authorId: string, followed: boolean, token: string) {
    return request(`/users/${authorId}/follow`, { method: followed ? 'DELETE' : 'POST' }, token);
  },
  getComments(postId: string) {
    return request<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  },
  createComment(postId: string, content: string, token: string, parentId?: string) {
    return request<{ comment: Comment }>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) }, token);
  },
  getComment(commentId: string) {
    return request<{ comment: Comment }>(`/comments/${commentId}`);
  },
  getNotifications(token: string, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 20));
    return request<NotificationListResult>(`/notifications?${query.toString()}`, {}, token);
  },
  markNotificationsRead(token: string) {
    return request('/notifications/read', { method: 'POST' }, token);
  },
  markNotificationRead(notificationId: string, token: string) {
    return request(`/notifications/${notificationId}/read`, { method: 'POST' }, token);
  },
};


