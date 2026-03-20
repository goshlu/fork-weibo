import { useEffect, useMemo, useState } from 'react';

import type { Comment, Post } from '../types/app';

function resolveMediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

function formatReason(reason?: string): string | null {
  if (!reason) return null;
  if (reason === 'similar-users') return 'Recommended for similar users';
  if (reason === 'network') return 'Recommended from your network';
  if (reason === 'popular') return 'Popular right now';
  if (reason === 'following') return 'From authors you follow';
  if (reason === 'hot') return 'Trending in the square';
  return reason;
}

function authorLabel(post: Post): string {
  return post.author?.nickname || `Author ${post.authorId.slice(0, 8)}`;
}

function authorInitial(post: Post): string {
  return authorLabel(post).trim().charAt(0).toUpperCase() || 'A';
}

function commentAuthorLabel(comment: Comment): string {
  return comment.author?.nickname || `User ${comment.authorId.slice(0, 8)}`;
}

function commentAuthorMeta(comment: Comment): string {
  return comment.author?.username ? `@${comment.author.username}` : `@${comment.authorId.slice(0, 8)}`;
}

function commentAuthorInitial(comment: Comment): string {
  return commentAuthorLabel(comment).trim().charAt(0).toUpperCase() || 'U';
}

function buildCommentTree(comments: Comment[]): { roots: Comment[]; childrenByParent: Map<string, Comment[]>; byId: Map<string, Comment> } {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const childrenByParent = new Map<string, Comment[]>();
  const roots: Comment[] = [];

  for (const comment of comments) {
    if (!comment.parentId || !byId.has(comment.parentId)) {
      roots.push(comment);
      continue;
    }

    const siblings = childrenByParent.get(comment.parentId) ?? [];
    siblings.push(comment);
    childrenByParent.set(comment.parentId, siblings);
  }

  return { roots, childrenByParent, byId };
}

type PostCardProps = {
  post: Post;
  liked: boolean;
  favorited?: boolean;
  followed: boolean;
  comments: Comment[];
  commentsOpen: boolean;
  commentDraft: string;
  busy: string;
  highlightedCommentId?: string;
  onLike: (postId: string) => void;
  onFavorite?: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onOpenAuthor?: (authorId: string) => void;
  onOpenPost?: (postId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
};

export function PostCard(props: PostCardProps) {
  const {
    post,
    liked,
    favorited = false,
    followed,
    comments,
    commentsOpen,
    commentDraft,
    busy,
    highlightedCommentId = '',
    onLike,
    onFavorite,
    onFollow,
    onOpenAuthor,
    onOpenPost,
    onToggleComments,
    onCommentDraftChange,
    onSubmitComment,
  } = props;

  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);

  useEffect(() => {
    if (!commentsOpen) {
      setReplyTarget(null);
      return;
    }

    if (replyTarget && !comments.some((comment) => comment.id === replyTarget.id)) {
      setReplyTarget(null);
    }
  }, [comments, commentsOpen, replyTarget]);

  useEffect(() => {
    if (!commentsOpen || !highlightedCommentId || typeof document === 'undefined') return;
    const target = document.querySelector(`[data-comment-id="${highlightedCommentId}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [commentsOpen, highlightedCommentId, comments]);

  const displayReason = formatReason(post.reason);
  const displayTime = new Date(post.publishedAt ?? post.updatedAt).toLocaleString();
  const canOpenAuthor = Boolean(onOpenAuthor);
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  function renderComment(comment: Comment, depth = 0) {
    const children = commentTree.childrenByParent.get(comment.id) ?? [];
    const parent = comment.parentId ? commentTree.byId.get(comment.parentId) : null;

    return (
      <div className={depth ? 'comment-thread nested' : 'comment-thread'} key={comment.id}>
        <div className={comment.id === highlightedCommentId ? 'comment-row highlighted' : 'comment-row'} data-comment-id={comment.id}>
          <div className="comment-head comment-head-rich">
            <div className="comment-author">
              <div className="comment-author-avatar">
                {comment.author?.avatarUrl ? (
                  <img alt={commentAuthorLabel(comment)} className="comment-author-avatar-image" src={resolveMediaUrl(comment.author.avatarUrl)} />
                ) : (
                  <span>{commentAuthorInitial(comment)}</span>
                )}
              </div>
              <div className="comment-author-copy">
                <strong>{commentAuthorLabel(comment)}</strong>
                <span>{commentAuthorMeta(comment)}</span>
              </div>
            </div>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          {parent ? <span className="comment-replying-to">Replying to {commentAuthorLabel(parent)}</span> : null}
          <p>{comment.content}</p>
          <button className="comment-reply-button" onClick={() => setReplyTarget(comment)} type="button">
            Reply
          </button>
        </div>
        {children.length ? <div className="comment-children">{children.map((child) => renderComment(child, depth + 1))}</div> : null}
      </div>
    );
  }

  return (
    <article className="post-card">
      <div className="post-head">
        <button
          className={canOpenAuthor ? 'post-author post-author-button' : 'post-author'}
          disabled={!canOpenAuthor}
          onClick={() => onOpenAuthor?.(post.authorId)}
          type="button"
        >
          <div className="post-author-avatar">
            {post.author?.avatarUrl ? (
              <img alt={authorLabel(post)} className="post-author-avatar-image" src={resolveMediaUrl(post.author.avatarUrl)} />
            ) : (
              <span>{authorInitial(post)}</span>
            )}
          </div>
          <div className="post-author-copy">
            <strong>{authorLabel(post)}</strong>
            <span>{post.author?.username ? `@${post.author.username}` : post.authorId.slice(0, 8)}</span>
          </div>
        </button>
        <div className="post-meta-stack">
          <span>{post.status === 'published' ? 'Published' : 'Draft'}</span>
          <span>{displayTime}</span>
        </div>
      </div>

      {displayReason ? <div className="post-reason">{displayReason}</div> : null}

      <p>{post.content}</p>
      {post.images.length ? (
        <div className="post-image-grid">
          {post.images.map((image, index) => (
            <img
              alt={`Post image ${index + 1}`}
              className="post-image"
              key={`${image.url}-${index}`}
              loading="lazy"
              src={resolveMediaUrl(image.url)}
            />
          ))}
        </div>
      ) : null}

      {post.stats ? (
        <div className="post-stats-row">
          <span>{post.stats.likesCount} likes</span>
          <span>{post.stats.commentsCount} comments</span>
          <span>{post.stats.favoritesCount} saves</span>
        </div>
      ) : null}

      <div className="post-actions">
        <button
          className={liked ? 'active-action' : ''}
          disabled={busy === `like:${post.id}`}
          onClick={() => onLike(post.id)}
          type="button"
        >
          {liked ? 'Unlike' : 'Like'}
        </button>
        {onFavorite ? (
          <button
            className={favorited ? 'active-action' : ''}
            disabled={busy === `favorite:${post.id}`}
            onClick={() => onFavorite(post.id)}
            type="button"
          >
            {favorited ? 'Unfavorite' : 'Favorite'}
          </button>
        ) : null}
        <button
          className={followed ? 'active-action' : ''}
          disabled={busy === `follow:${post.authorId}`}
          onClick={() => onFollow(post.authorId)}
          type="button"
        >
          {followed ? 'Unfollow' : 'Follow author'}
        </button>
        {onOpenPost ? (
          <button onClick={() => onOpenPost(post.id)} type="button">
            View details
          </button>
        ) : null}
        <button onClick={() => onToggleComments(post.id)} type="button">
          {commentsOpen ? 'Hide comments' : 'Show comments'}
        </button>
      </div>
      {commentsOpen ? (
        <div className="comments-panel">
          <div className="comment-list">
            {commentTree.roots.length ? commentTree.roots.map((comment) => renderComment(comment)) : <p className="comment-empty">No comments yet.</p>}
          </div>
          {replyTarget ? (
            <div className="comment-reply-banner">
              <span>Replying to {commentAuthorLabel(replyTarget)}</span>
              <button className="comment-reply-button" onClick={() => setReplyTarget(null)} type="button">
                Cancel
              </button>
            </div>
          ) : null}
          <div className="comment-composer">
            <input
              onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
              placeholder={replyTarget ? `Reply to ${commentAuthorLabel(replyTarget)}` : 'Write a comment'}
              value={commentDraft}
            />
            <button
              disabled={busy === `comment:${post.id}`}
              onClick={() => {
                onSubmitComment(post.id, replyTarget?.id);
                setReplyTarget(null);
              }}
              type="button"
            >
              Reply
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
