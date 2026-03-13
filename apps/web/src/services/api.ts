import type {
  Channel,
  Comment,
  ComposerState,
  Notification,
  Post,
  SearchTrend,
  Topic,
  User,
} from '../types/app';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(payload: { username: string; password: string }) {
    return request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  register(payload: { username: string; password: string; nickname: string }) {
    return request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createPost(payload: ComposerState, token: string) {
    return request<{ post: Post }>(
      '/posts',
      { method: 'POST', body: JSON.stringify(payload) },
      token,
    );
  },
  getFeed(mode: 'hot' | 'following' | 'recommended', token?: string) {
    const path =
      mode === 'hot'
        ? '/feed/hot?page=1&pageSize=10'
        : mode === 'following'
          ? '/feed/following?page=1&pageSize=10'
          : '/feed/recommended?page=1&pageSize=10';
    return request<{ items: Post[] }>(path, {}, token);
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
  followAuthor(authorId: string, followed: boolean, token: string) {
    return request(`/users/${authorId}/follow`, { method: followed ? 'DELETE' : 'POST' }, token);
  },
  getComments(postId: string) {
    return request<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  },
  createComment(postId: string, content: string, token: string) {
    return request<{ comment: Comment }>(
      `/posts/${postId}/comments`,
      { method: 'POST', body: JSON.stringify({ content }) },
      token,
    );
  },
  getNotifications(token: string) {
    return request<{ notifications: Notification[] }>('/notifications', {}, token);
  },
  markNotificationsRead(token: string) {
    return request('/notifications/read', { method: 'POST' }, token);
  },
};
