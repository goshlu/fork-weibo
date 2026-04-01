import type {
  Channel,
  Comment,
  ComposerState,
  FeedListResult,
  FavoriteItem,
  FeedMode,
  NotificationListResult,
  Post,
  SearchListResult,
  SearchTrend,
  Topic,
  User,
  UserProfile,
} from '../types/app';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

/**
 * HTTP 请求基础函数
 * - 不再需要在 header 中手动传递 token
 * - 认证通过 httpOnly cookie 自动处理
 * - credentials: 'include' 确保跨域请求携带 cookie
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include', // 关键：确保请求携带 cookie
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/**
 * 带可选认证的请求
 * - 对于需要可选认证的 API（如获取 feed）
 * - 仍然使用 credentials: 'include'
 */
async function requestWithOptionalAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

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
  logout() {
    return request<{ message: string }>('/auth/logout', { method: 'POST' });
  },
  createPost(payload: ComposerState) {
    if (payload.images.length) {
      const formData = new FormData();
      formData.append('content', payload.content);
      formData.append('status', payload.status);
      for (const image of payload.images) {
        formData.append('images', image);
      }
      return request<{ post: Post }>('/posts', { method: 'POST', body: formData });
    }

    return request<{ post: Post }>(
      '/posts',
      { method: 'POST', body: JSON.stringify({ content: payload.content, status: payload.status }) },
    );
  },
  updatePost(postId: string, payload: Partial<Omit<ComposerState, 'images'>> & { content?: string }) {
    return request<{ post: Post }>(`/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deletePost(postId: string) {
    return request<void>(`/posts/${postId}`, { method: 'DELETE' });
  },
  getPost(postId: string) {
    return requestWithOptionalAuth<{ post: Post }>(`/posts/${postId}`);
  },
  getFeed(mode: FeedMode, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 10));
    const path = mode === 'hot' ? '/feed/hot' : mode === 'following' ? '/feed/following' : '/feed/recommended';
    return requestWithOptionalAuth<FeedListResult>(`${path}?${query.toString()}`);
  },
  getPosts(params: { pageSize?: number; authorId?: string; status?: 'draft' | 'published' }) {
    const query = new URLSearchParams();
    query.set('page', '1');
    query.set('pageSize', String(params.pageSize ?? 20));
    if (params.authorId) query.set('authorId', params.authorId);
    if (params.status) query.set('status', params.status);
    return requestWithOptionalAuth<{ items: Post[] }>(`/posts?${query.toString()}`);
  },
  getMyUser() {
    return request<{ user: User }>('/users/me');
  },
  updateMyUser(payload: { nickname?: string; bio?: string; password?: string }) {
    return request<{ user: User }>('/users/me', { method: 'PATCH', body: JSON.stringify(payload) });
  },
  uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ user: User }>('/users/me/avatar', { method: 'POST', body: formData });
  },
  getProfile(userId: string) {
    return requestWithOptionalAuth<{ profile: UserProfile }>(`/users/${userId}/profile`);
  },
  getFavorites() {
    return request<{ items: FavoriteItem[]; total: number }>('/favorites');
  },
  search(keyword: string, params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    query.set('q', keyword);
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 8));
    return request<SearchListResult>(`/search?${query.toString()}`);
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
  likePost(postId: string, liked: boolean) {
    return request(`/posts/${postId}/likes`, { method: liked ? 'DELETE' : 'POST' });
  },
  favoritePost(postId: string, favorited: boolean, folderName = 'default') {
    return favorited
      ? request(`/posts/${postId}/favorites/${encodeURIComponent(folderName)}`, { method: 'DELETE' })
      : request(`/posts/${postId}/favorites`, { method: 'POST', body: JSON.stringify({ folderName }) });
  },
  followAuthor(authorId: string, followed: boolean) {
    return request(`/users/${authorId}/follow`, { method: followed ? 'DELETE' : 'POST' });
  },
  getComments(postId: string) {
    return request<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  },
  createComment(postId: string, content: string, parentId?: string) {
    return request<{ comment: Comment }>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content, parentId }) });
  },
  getComment(commentId: string) {
    return request<{ comment: Comment }>(`/comments/${commentId}`);
  },
  getNotifications(params?: { page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    query.set('page', String(params?.page ?? 1));
    query.set('pageSize', String(params?.pageSize ?? 20));
    return request<NotificationListResult>(`/notifications?${query.toString()}`);
  },
  /**
   * 获取��知流 URL
   * 
   * 安全变更：现在不再需要传递 token 参数
   * 认证通过 httpOnly cookie 自动处理
   * 
   * @deprecated 使用 EventSource 时会自动携带 cookie，无需手动传递 token
   */
  getNotificationStreamUrl() {
    return `${apiBaseUrl}/notifications/stream`;
  },
  markNotificationsRead() {
    return request('/notifications/read', { method: 'POST' });
  },
  markNotificationRead(notificationId: string) {
    return request(`/notifications/${notificationId}/read`, { method: 'POST' });
  },
};
