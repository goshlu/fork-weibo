import { useEffect, useMemo, useState } from 'react';

import { formatTemplate, useI18n } from '../i18n';
import type { Comment, Post } from '../types/app';

function resolveMediaUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

function formatReason(reason: string | undefined, texts: ReturnType<typeof useI18n>['dictionary']['postCard']): string | null {
  if (!reason) return null;
  if (reason === 'similar-users') return texts.recommendedSimilarUsers;
  if (reason === 'network') return texts.recommendedNetwork;
  if (reason === 'popular') return texts.popularNow;
  if (reason === 'following') return texts.fromFollowingAuthors;
  if (reason === 'hot') return texts.trendingSquare;
  return reason;
}

function authorLabel(post: Post, texts: ReturnType<typeof useI18n>['dictionary']['postCard']): string {
  return post.author?.nickname || `${texts.authorFallback} ${post.authorId.slice(0, 8)}`;
}

function authorInitial(post: Post, texts: ReturnType<typeof useI18n>['dictionary']['postCard']): string {
  return authorLabel(post, texts).trim().charAt(0).toUpperCase() || 'A';
}

function commentAuthorLabel(comment: Comment, texts: ReturnType<typeof useI18n>['dictionary']['postCard']): string {
  return comment.author?.nickname || `${texts.userFallback} ${comment.authorId.slice(0, 8)}`;
}

function commentAuthorMeta(comment: Comment): string {
  return comment.author?.username ? `@${comment.author.username}` : `@${comment.authorId.slice(0, 8)}`;
}

function commentAuthorInitial(comment: Comment, texts: ReturnType<typeof useI18n>['dictionary']['postCard']): string {
  return commentAuthorLabel(comment, texts).trim().charAt(0).toUpperCase() || 'U';
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
  const { dictionary } = useI18n();
  const texts = dictionary.postCard;
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

  const displayReason = formatReason(post.reason, texts);
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
                  <img alt={commentAuthorLabel(comment, texts)} className="comment-author-avatar-image" src={resolveMediaUrl(comment.author.avatarUrl)} />
                ) : (
                  <span>{commentAuthorInitial(comment, texts)}</span>
                )}
              </div>
              <div className="comment-author-copy">
                <strong>{commentAuthorLabel(comment, texts)}</strong>
                <span>{commentAuthorMeta(comment)}</span>
              </div>
            </div>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          {parent ? <span className="comment-replying-to">{formatTemplate(texts.replyingTo, { name: commentAuthorLabel(parent, texts) })}</span> : null}
          <p>{comment.content}</p>
          <button className="comment-reply-button" onClick={() => setReplyTarget(comment)} type="button">
            {texts.reply}
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
              <img alt={authorLabel(post, texts)} className="post-author-avatar-image" src={resolveMediaUrl(post.author.avatarUrl)} />
            ) : (
              <span>{authorInitial(post, texts)}</span>
            )}
          </div>
          <div className="post-author-copy">
            <strong>{authorLabel(post, texts)}</strong>
            <span>{post.author?.username ? `@${post.author.username}` : post.authorId.slice(0, 8)}</span>
          </div>
        </button>
        <div className="post-meta-stack">
          <span>{post.status === 'published' ? texts.published : texts.draft}</span>
          <span>{displayTime}</span>
        </div>
      </div>

      {displayReason ? <div className="post-reason">{displayReason}</div> : null}

      <p>{post.content}</p>
      {post.images.length ? (
        <div className="post-image-grid">
          {post.images.map((image, index) => (
            <img
              alt={formatTemplate(texts.postImageAlt, { index: index + 1 })}
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
          <span>{formatTemplate(texts.likesCount, { count: post.stats.likesCount })}</span>
          <span>{formatTemplate(texts.commentsCount, { count: post.stats.commentsCount })}</span>
          <span>{formatTemplate(texts.savesCount, { count: post.stats.favoritesCount })}</span>
        </div>
      ) : null}

      <div className="post-actions">
        <button
          className={liked ? 'active-action' : ''}
          disabled={busy === `like:${post.id}`}
          onClick={() => onLike(post.id)}
          type="button"
        >
          {liked ? texts.unlike : texts.like}
        </button>
        {onFavorite ? (
          <button
            className={favorited ? 'active-action' : ''}
            disabled={busy === `favorite:${post.id}`}
            onClick={() => onFavorite(post.id)}
            type="button"
          >
            {favorited ? texts.unfavorite : texts.favorite}
          </button>
        ) : null}
        <button
          className={followed ? 'active-action' : ''}
          disabled={busy === `follow:${post.authorId}`}
          onClick={() => onFollow(post.authorId)}
          type="button"
        >
          {followed ? texts.unfollow : texts.followAuthor}
        </button>
        {onOpenPost ? (
          <button onClick={() => onOpenPost(post.id)} type="button">
            {texts.viewDetails}
          </button>
        ) : null}
        <button onClick={() => onToggleComments(post.id)} type="button">
          {commentsOpen ? texts.hideComments : texts.showComments}
        </button>
      </div>
      {commentsOpen ? (
        <div className="comments-panel">
          <div className="comment-list">
            {commentTree.roots.length ? commentTree.roots.map((comment) => renderComment(comment)) : <p className="comment-empty">{texts.noComments}</p>}
          </div>
          {replyTarget ? (
            <div className="comment-reply-banner">
              <span>{formatTemplate(texts.replyingTo, { name: commentAuthorLabel(replyTarget, texts) })}</span>
              <button className="comment-reply-button" onClick={() => setReplyTarget(null)} type="button">
                {texts.cancel}
              </button>
            </div>
          ) : null}
          <div className="comment-composer">
            <input
              onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
              placeholder={replyTarget ? formatTemplate(texts.replyToPlaceholder, { name: commentAuthorLabel(replyTarget, texts) }) : texts.writeComment}
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
              {texts.reply}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
