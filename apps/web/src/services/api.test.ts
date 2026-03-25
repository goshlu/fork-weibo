import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('api service', () => {
  const mockToken = 'test-token';
  const apiBaseUrl = 'http://localhost:4000/api';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('request helper', () => {
    it('should make a GET request with correct headers', async () => {
      const mockData = { items: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });

      const result = await api.getTopics();

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/discover/topics?page=1&pageSize=6`,
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should include Authorization header when token is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ user: {} }),
      });

      await api.getMyUser(mockToken);

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    });

    it('should set Content-Type header for JSON requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: 'test', user: {} }),
      });

      await api.login({ username: 'test', password: 'test' });

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('should not set Content-Type for FormData requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ post: {} }),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await api.createPost({ content: 'test', status: 'published', images: [file] }, mockToken);

      const call = mockFetch.mock.calls[0];
      const headers = call[1].headers as Headers;
      expect(headers.get('Content-Type')).toBeNull();
    });

    it('should throw error with message from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      await expect(api.login({ username: 'test', password: 'wrong' })).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with status code when no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.login({ username: 'test', password: 'test' })).rejects.toThrow('Request failed: 500');
    });

    it('should return undefined for 204 status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await api.deletePost('post-1', mockToken);

      expect(result).toBeUndefined();
    });
  });

  describe('auth endpoints', () => {
    it('should call login endpoint', async () => {
      const mockResponse = { token: mockToken, user: { id: '1', username: 'test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.login({ username: 'testuser', password: 'password123' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should call register endpoint', async () => {
      const mockResponse = { token: mockToken, user: { id: '1', username: 'test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.register({ username: 'testuser', password: 'password123', nickname: 'Test' });

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ username: 'testuser', password: 'password123', nickname: 'Test' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('post endpoints', () => {
    it('should create post without images', async () => {
      const mockResponse = { post: { id: 'post-1', content: 'Test post' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.createPost({ content: 'Test post', status: 'published', images: [] }, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Test post', status: 'published' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create post with images using FormData', async () => {
      const mockResponse = { post: { id: 'post-1', content: 'Test post' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await api.createPost({ content: 'Test post', status: 'published', images: [file] }, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update post', async () => {
      const mockResponse = { post: { id: 'post-1', content: 'Updated' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.updatePost('post-1', { content: 'Updated' }, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ content: 'Updated' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deletePost('post-1', mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1`,
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should get single post', async () => {
      const mockResponse = { post: { id: 'post-1', content: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getPost('post-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1`,
        expect.objectContaining({})
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get feed with correct mode', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], page: 1, pageSize: 10, total: 0 }),
      });

      await api.getFeed('hot');
      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/feed/hot?page=1&pageSize=10`,
        expect.any(Object)
      );

      await api.getFeed('following');
      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/feed/following?page=1&pageSize=10`,
        expect.any(Object)
      );

      await api.getFeed('recommended');
      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/feed/recommended?page=1&pageSize=10`,
        expect.any(Object)
      );
    });

    it('should get feed with custom pagination params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], page: 2, pageSize: 5, total: 11 }),
      });

      await api.getFeed('hot', undefined, { page: 2, pageSize: 5 });

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/feed/hot?page=2&pageSize=5`,
        expect.any(Object)
      );
    });

    it('should get posts with query params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await api.getPosts({ pageSize: 10, authorId: 'author-1', status: 'published' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('page=1');
      expect(call[0]).toContain('pageSize=10');
      expect(call[0]).toContain('authorId=author-1');
      expect(call[0]).toContain('status=published');
    });

    it('should get posts with default pageSize when not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await api.getPosts({});

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('pageSize=20');
    });

    it('should get posts with only authorId', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await api.getPosts({ authorId: 'author-1' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('authorId=author-1');
      expect(call[0]).not.toContain('status=');
    });

    it('should get posts with only status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [] }),
      });

      await api.getPosts({ status: 'draft' });

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toContain('status=draft');
      expect(call[0]).not.toContain('authorId=');
    });
  });

  describe('user endpoints', () => {
    it('should get current user', async () => {
      const mockResponse = { user: { id: '1', username: 'test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getMyUser(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/me`,
        expect.objectContaining({})
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update current user', async () => {
      const mockResponse = { user: { id: '1', nickname: 'New Name' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.updateMyUser({ nickname: 'New Name' }, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/me`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ nickname: 'New Name' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should upload avatar', async () => {
      const mockResponse = { user: { id: '1', avatarUrl: '/avatar.jpg' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await api.uploadAvatar(file, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/me/avatar`,
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get user profile', async () => {
      const mockResponse = { profile: { id: '1', username: 'test', stats: { followers: 0, following: 0, posts: 0, likesReceived: 0 } } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getProfile('user-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/user-1/profile`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('interaction endpoints', () => {
    it('should like a post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.likePost('post-1', false, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/likes`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should unlike a post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.likePost('post-1', true, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/likes`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should favorite a post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.favoritePost('post-1', false, mockToken, 'my-folder');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/favorites`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ folderName: 'my-folder' }),
        })
      );
    });

    it('should unfavorite a post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.favoritePost('post-1', true, mockToken, 'my-folder');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/favorites/my-folder`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should follow an author', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.followAuthor('author-1', false, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/author-1/follow`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should unfollow an author', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.followAuthor('author-1', true, mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/users/author-1/follow`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('comment endpoints', () => {
    it('should get comments for a post', async () => {
      const mockResponse = { comments: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getComments('post-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/comments`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a comment', async () => {
      const mockResponse = { comment: { id: 'comment-1', content: 'Test comment' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.createComment('post-1', 'Test comment', mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/comments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Test comment', parentId: undefined }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create a reply comment', async () => {
      const mockResponse = { comment: { id: 'comment-2', content: 'Reply', parentId: 'comment-1' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.createComment('post-1', 'Reply', mockToken, 'comment-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/posts/post-1/comments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Reply', parentId: 'comment-1' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get a single comment', async () => {
      const mockResponse = { comment: { id: 'comment-1', content: 'Test' } };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getComment('comment-1');

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/comments/comment-1`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('notification endpoints', () => {
    it('should get notifications', async () => {
      const mockResponse = { items: [], page: 1, pageSize: 20, total: 0, hasMore: false };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getNotifications(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/notifications?page=1&pageSize=20`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get notifications with custom pagination', async () => {
      const mockResponse = { items: [], page: 2, pageSize: 10, total: 25, hasMore: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getNotifications(mockToken, { page: 2, pageSize: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/notifications?page=2&pageSize=10`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should mark all notifications as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.markNotificationsRead(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/notifications/read`,
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should mark a single notification as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      });

      await api.markNotificationRead('notif-1', mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/notifications/notif-1/read`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('discovery endpoints', () => {
    it('should get topics', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getTopics();

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/discover/topics?page=1&pageSize=6`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get search trends', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getSearchTrends();

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/discover/searches?page=1&pageSize=6`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get channels', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getChannels();

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/discover/channels`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('search endpoint', () => {
    it('should search with encoded keyword', async () => {
      const mockResponse = { items: [] };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.search('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/search?q=test%20query'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('favorites endpoint', () => {
    it('should get favorites', async () => {
      const mockResponse = { items: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.getFavorites(mockToken);

      expect(mockFetch).toHaveBeenCalledWith(
        `${apiBaseUrl}/favorites`,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
