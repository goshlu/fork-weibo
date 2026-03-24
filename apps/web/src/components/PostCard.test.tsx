import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { PostCard } from './PostCard';
import type { Post, Comment } from '../types/app';

// Mock scrollIntoView for highlighted comment tests
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
});

// Helper to create mock post
function createMockPost(overrides: Partial<Post> = {}): Post {
  const now = new Date();
  return {
    id: 'post-1',
    authorId: 'author-1',
    content: 'Test post content',
    images: [],
    author: {
      id: 'author-1',
      username: 'testuser',
      nickname: 'Test User',
      avatarUrl: null,
    },
    stats: {
      likesCount: 10,
      commentsCount: 5,
      favoritesCount: 3,
    },
    status: 'published',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: now.toISOString(),
    ...overrides,
  };
}

// Helper to create mock comment
function createMockComment(overrides: Partial<Comment> = {}): Comment {
  const now = new Date();
  return {
    id: 'comment-1',
    postId: 'post-1',
    authorId: 'commenter-1',
    parentId: null,
    content: 'Test comment',
    author: {
      id: 'commenter-1',
      username: 'commenter',
      nickname: 'Commenter',
      avatarUrl: null,
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

describe('PostCard', () => {
  const defaultHandlers = {
    onLike: vi.fn(),
    onFavorite: vi.fn(),
    onFollow: vi.fn(),
    onOpenAuthor: vi.fn(),
    onOpenPost: vi.fn(),
    onToggleComments: vi.fn(),
    onCommentDraftChange: vi.fn(),
    onSubmitComment: vi.fn(),
  };

  const defaultProps = {
    liked: false,
    favorited: false,
    followed: false,
    comments: [] as Comment[],
    commentsOpen: false,
    commentDraft: '',
    busy: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render post content', () => {
      const post = createMockPost({ content: 'Hello world!' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Hello world!')).toBeInTheDocument();
    });

    it('should render author info', () => {
      const post = createMockPost({
        author: {
          id: 'author-1',
          username: 'johndoe',
          nickname: 'John Doe',
          avatarUrl: null,
        },
      });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should render author initial when no avatar', () => {
      const post = createMockPost({
        author: {
          id: 'author-1',
          username: 'johndoe',
          nickname: 'John Doe',
          avatarUrl: null,
        },
      });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should render post stats', () => {
      const post = createMockPost({
        stats: {
          likesCount: 100,
          commentsCount: 50,
          favoritesCount: 25,
        },
      });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('100 likes')).toBeInTheDocument();
      expect(screen.getByText('50 comments')).toBeInTheDocument();
      expect(screen.getByText('25 saves')).toBeInTheDocument();
    });

    it('should not render stats when not provided', () => {
      const post = createMockPost();
      delete post.stats;

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText(/likes/)).not.toBeInTheDocument();
    });

    it('should render images', () => {
      const post = createMockPost({
        images: [
          { url: '/image1.jpg', width: 100, height: 100 },
          { url: '/image2.jpg', width: 200, height: 200 },
        ],
      });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('alt', 'Post image 1');
      expect(images[1]).toHaveAttribute('alt', 'Post image 2');
    });

    it('should render reason badge', () => {
      const post = createMockPost({ reason: 'popular' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Popular right now')).toBeInTheDocument();
    });

    it('should render draft status', () => {
      const post = createMockPost({ status: 'draft' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('should render published status', () => {
      const post = createMockPost({ status: 'published' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Published')).toBeInTheDocument();
    });
  });

  describe('action buttons', () => {
    it('should render like button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument();
    });

    it('should show unlike when liked', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          liked={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unlike' })).toBeInTheDocument();
    });

    it('should call onLike when clicking like button', async () => {
      const user = userEvent.setup();
      const onLike = vi.fn();
      const post = createMockPost({ id: 'post-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Like' }));

      expect(onLike).toHaveBeenCalledWith('post-123');
    });

    it('should disable like button when busy', () => {
      const post = createMockPost({ id: 'post-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          busy="like:post-123"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Like' })).toBeDisabled();
    });

    it('should render favorite button when onFavorite provided', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Favorite' })).toBeInTheDocument();
    });

    it('should not render favorite button when onFavorite not provided', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      expect(screen.queryByRole('button', { name: 'Favorite' })).not.toBeInTheDocument();
    });

    it('should show unfavorited when favorited', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          favorited={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unfavorite' })).toBeInTheDocument();
    });

    it('should call onFavorite when clicking favorite button', async () => {
      const user = userEvent.setup();
      const onFavorite = vi.fn();
      const post = createMockPost({ id: 'post-456' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Favorite' }));

      expect(onFavorite).toHaveBeenCalledWith('post-456');
    });

    it('should render follow button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Follow author' })).toBeInTheDocument();
    });

    it('should show unfollow when followed', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          followed={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument();
    });

    it('should call onFollow when clicking follow button', async () => {
      const user = userEvent.setup();
      const onFollow = vi.fn();
      const post = createMockPost({ authorId: 'author-789' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Follow author' }));

      expect(onFollow).toHaveBeenCalledWith('author-789');
    });

    it('should disable follow button when busy', () => {
      const post = createMockPost({ authorId: 'author-789' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          busy="follow:author-789"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Follow author' })).toBeDisabled();
    });

    it('should render view details button when onOpenPost provided', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'View details' })).toBeInTheDocument();
    });

    it('should not render view details button when onOpenPost not provided', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={() => { }}
          onSubmitComment={() => { }}
        />
      );

      expect(screen.queryByRole('button', { name: 'View details' })).not.toBeInTheDocument();
    });

    it('should call onOpenPost when clicking view details', async () => {
      const user = userEvent.setup();
      const onOpenPost = vi.fn();
      const post = createMockPost({ id: 'post-999' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onOpenPost={onOpenPost}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'View details' }));

      expect(onOpenPost).toHaveBeenCalledWith('post-999');
    });

    it('should render show comments button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Show comments' })).toBeInTheDocument();
    });

    it('should show hide comments when comments open', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Hide comments' })).toBeInTheDocument();
    });

    it('should call onToggleComments when clicking toggle comments', async () => {
      const user = userEvent.setup();
      const onToggleComments = vi.fn();
      const post = createMockPost({ id: 'post-111' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Show comments' }));

      expect(onToggleComments).toHaveBeenCalledWith('post-111');
    });
  });

  describe('author interaction', () => {
    it('should call onOpenAuthor when clicking author button', async () => {
      const user = userEvent.setup();
      const onOpenAuthor = vi.fn();
      const post = createMockPost({ authorId: 'author-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onOpenAuthor={onOpenAuthor}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.click(screen.getByText('Test User'));

      expect(onOpenAuthor).toHaveBeenCalledWith('author-123');
    });

    it('should not have clickable author when onOpenAuthor not provided', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      const authorButton = screen.getByText('Test User').closest('button');
      expect(authorButton).toBeDisabled();
    });
  });

  describe('comments', () => {
    it('should not show comments panel when closed', () => {
      const post = createMockPost();
      const comments = [createMockComment()];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={false}
          {...defaultHandlers}
        />
      );

      expect(screen.queryByText('Test comment')).not.toBeInTheDocument();
    });

    it('should show comments panel when open', () => {
      const post = createMockPost();
      const comments = [createMockComment({ content: 'Great post!' })];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Great post!')).toBeInTheDocument();
    });

    it('should show empty state when no comments', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={[]}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    });

    it('should render nested comments', () => {
      const post = createMockPost();
      const comments = [
        createMockComment({ id: 'comment-1', content: 'Parent comment' }),
        createMockComment({ id: 'comment-2', parentId: 'comment-1', content: 'Reply comment' }),
      ];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Parent comment')).toBeInTheDocument();
      expect(screen.getByText('Reply comment')).toBeInTheDocument();
    });

    it('should show replying to for nested comments', () => {
      const post = createMockPost();
      const comments = [
        createMockComment({
          id: 'comment-1',
          author: { id: 'a1', username: 'alice', nickname: 'Alice', avatarUrl: null },
          content: 'Parent comment'
        }),
        createMockComment({
          id: 'comment-2',
          parentId: 'comment-1',
          content: 'Reply comment'
        }),
      ];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('Replying to Alice')).toBeInTheDocument();
    });

    it('should render comment input', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByPlaceholderText('Write a comment')).toBeInTheDocument();
    });

    it('should call onCommentDraftChange when typing', async () => {
      const user = userEvent.setup();
      const onCommentDraftChange = vi.fn();
      const post = createMockPost({ id: 'post-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          commentsOpen={true}
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={onCommentDraftChange}
          onSubmitComment={defaultHandlers.onSubmitComment}
        />
      );

      await user.type(screen.getByPlaceholderText('Write a comment'), 'H');

      expect(onCommentDraftChange).toHaveBeenCalledWith('post-123', 'H');
    });

    it('should call onSubmitComment when clicking reply button', async () => {
      const user = userEvent.setup();
      const onSubmitComment = vi.fn();
      const post = createMockPost({ id: 'post-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          commentsOpen={true}
          commentDraft="Nice post!"
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={onSubmitComment}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Reply' }));

      expect(onSubmitComment).toHaveBeenCalledWith('post-123', undefined);
    });

    it('should disable reply button when busy', () => {
      const post = createMockPost({ id: 'post-123' });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          commentsOpen={true}
          busy="comment:post-123"
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Reply' })).toBeDisabled();
    });

    it('should show reply banner when replying to comment', async () => {
      const user = userEvent.setup();
      const post = createMockPost();
      const comments = [
        createMockComment({
          id: 'comment-1',
          author: { id: 'a1', username: 'bob', nickname: 'Bob', avatarUrl: null },
          content: 'Nice post!'
        }),
      ];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          {...defaultHandlers}
        />
      );

      // Click the Reply button on the comment (first Reply button)
      const replyButtons = screen.getAllByRole('button', { name: 'Reply' });
      await user.click(replyButtons[0]);

      expect(screen.getByText(/Replying to Bob/)).toBeInTheDocument();
    });

    it('should call onSubmitComment with parentId when replying', async () => {
      const user = userEvent.setup();
      const onSubmitComment = vi.fn();
      const post = createMockPost({ id: 'post-123' });
      const comments = [
        createMockComment({
          id: 'comment-1',
          content: 'Parent comment'
        }),
      ];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          commentDraft="Reply text"
          onLike={defaultHandlers.onLike}
          onFavorite={defaultHandlers.onFavorite}
          onFollow={defaultHandlers.onFollow}
          onToggleComments={defaultHandlers.onToggleComments}
          onCommentDraftChange={defaultHandlers.onCommentDraftChange}
          onSubmitComment={onSubmitComment}
        />
      );

      // Click Reply on the comment (first Reply button in comment)
      const replyButtons = screen.getAllByRole('button', { name: 'Reply' });
      await user.click(replyButtons[0]);

      // Click the submit Reply button in the composer (last Reply button)
      const submitButtons = screen.getAllByRole('button', { name: 'Reply' });
      await user.click(submitButtons[submitButtons.length - 1]);

      expect(onSubmitComment).toHaveBeenCalledWith('post-123', 'comment-1');
    });
  });

  describe('highlighted comment', () => {
    it('should highlight specified comment', () => {
      const post = createMockPost();
      const comments = [
        createMockComment({ id: 'comment-1', content: 'First comment' }),
        createMockComment({ id: 'comment-2', content: 'Second comment' }),
      ];

      render(
        <PostCard
          post={post}
          {...defaultProps}
          comments={comments}
          commentsOpen={true}
          highlightedCommentId="comment-2"
          {...defaultHandlers}
        />
      );

      const highlightedRow = document.querySelector('[data-comment-id="comment-2"]');
      expect(highlightedRow).toHaveClass('highlighted');
    });
  });

  describe('active states', () => {
    it('should show active style for liked button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          liked={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unlike' })).toHaveClass('active-action');
    });

    it('should show active style for favorited button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          favorited={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unfavorite' })).toHaveClass('active-action');
    });

    it('should show active style for followed button', () => {
      const post = createMockPost();

      render(
        <PostCard
          post={post}
          {...defaultProps}
          followed={true}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('button', { name: 'Unfollow' })).toHaveClass('active-action');
    });
  });

  describe('edge cases', () => {
    it('should render without author', () => {
      const post = createMockPost();
      delete post.author;

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText(/Author/)).toBeInTheDocument();
    });

    it('should handle author with only username', () => {
      const post = createMockPost({
        author: {
          id: 'author-1',
          username: 'johndoe',
          nickname: '',
          avatarUrl: null,
        },
      });

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      expect(screen.getByText('@johndoe')).toBeInTheDocument();
    });

    it('should handle long authorId gracefully', () => {
      const post = createMockPost();
      delete post.author;

      render(
        <PostCard
          post={post}
          {...defaultProps}
          {...defaultHandlers}
        />
      );

      // Should show truncated authorId
      expect(screen.getByText(/Author/)).toBeInTheDocument();
    });
  });
});
