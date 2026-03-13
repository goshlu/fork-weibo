import type { Comment, Post } from '../types/app';

type PostCardProps = {
  post: Post;
  liked: boolean;
  followed: boolean;
  comments: Comment[];
  commentsOpen: boolean;
  commentDraft: string;
  busy: string;
  onLike: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
};

export function PostCard({
  post,
  liked,
  followed,
  comments,
  commentsOpen,
  commentDraft,
  busy,
  onLike,
  onFollow,
  onToggleComments,
  onCommentDraftChange,
  onSubmitComment,
}: PostCardProps) {
  return (
    <article className="post-card">
      <div className="post-meta">
        <span>{post.status === 'published' ? '已发布' : '草稿'}</span>
        <span>{new Date(post.updatedAt).toLocaleString()}</span>
      </div>
      <p>{post.content}</p>
      <div className="post-footer">
        <span>作者 {post.authorId.slice(0, 8)}</span>
        <span>{post.id.slice(0, 8)}</span>
      </div>
      <div className="post-actions">
        <button
          className={liked ? 'active-action' : ''}
          disabled={busy === `like:${post.id}`}
          onClick={() => onLike(post.id)}
          type="button"
        >
          {liked ? '取消点赞' : '点赞'}
        </button>
        <button
          className={followed ? 'active-action' : ''}
          disabled={busy === `follow:${post.authorId}`}
          onClick={() => onFollow(post.authorId)}
          type="button"
        >
          {followed ? '取消关注' : '关注作者'}
        </button>
        <button onClick={() => onToggleComments(post.id)} type="button">
          {commentsOpen ? '收起评论' : '查看评论'}
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
              <p className="comment-empty">还没有评论。</p>
            )}
          </div>
          <div className="comment-composer">
            <input
              onChange={(event) => onCommentDraftChange(post.id, event.target.value)}
              placeholder="写下你的评论"
              value={commentDraft}
            />
            <button
              disabled={busy === `comment:${post.id}`}
              onClick={() => onSubmitComment(post.id)}
              type="button"
            >
              发送
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
