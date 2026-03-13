import type { Comment, Post } from '../types/app';

type PostCardProps = {
  post: Post;
  liked: boolean;
  favorited?: boolean;
  followed: boolean;
  comments: Comment[];
  commentsOpen: boolean;
  commentDraft: string;
  busy: string;
  onLike: (postId: string) => void;
  onFavorite?: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
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
    onLike,
    onFavorite,
    onFollow,
    onToggleComments,
    onCommentDraftChange,
    onSubmitComment,
  } = props;

  return (
    <article className="post-card">
      <div className="post-meta">
        <span>{post.status === 'published' ? 'Published' : 'Draft'}</span>
        <span>{new Date(post.updatedAt).toLocaleString()}</span>
      </div>
      <p>{post.content}</p>
      <div className="post-footer">
        <span>Author {post.authorId.slice(0, 8)}</span>
        <span>{post.id.slice(0, 8)}</span>
      </div>
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
        <button onClick={() => onToggleComments(post.id)} type="button">
          {commentsOpen ? 'Hide comments' : 'Show comments'}
        </button>
      </div>
      {commentsOpen ? (
        <div className="comments-panel">
          <div className="comment-list">
            {comments.length ? (
              comments.map((comment) => (
                <div className="comment-row" key={comment.id}>
                  <strong>{comment.authorId.slice(0, 8)}</strong>
                  <p>{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="comment-empty">No comments yet.</p>
            )}
          </div>
          <div className="comment-composer">
            <input
              onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
              placeholder="Write a comment"
              value={commentDraft}
            />
            <button
              disabled={busy === `comment:${post.id}`}
              onClick={() => onSubmitComment(post.id)}
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
