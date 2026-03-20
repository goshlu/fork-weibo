import { PostCard } from '../PostCard';
import type { Comment, Post } from '../../types/app';

type PostPageProps = {
  busy: string;
  commentDraft: string;
  comments: Comment[];
  favoritePostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  post: Post | null;
  highlightedCommentId: string;
  onCommentDraftChange: (postId: string, value: string) => void;
  onFavorite: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (postId: string) => void;
  onOpenAuthor: (authorId: string) => void;
  onOpenPost: (postId: string) => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
  onToggleComments: (postId: string) => void;
};

export function PostPage(props: PostPageProps) {
  const {
    busy,
    commentDraft,
    comments,
    favoritePostIds,
    followingAuthorIds,
    likedPostIds,
    post,
    highlightedCommentId,
    onCommentDraftChange,
    onFavorite,
    onFollow,
    onLike,
    onOpenAuthor,
    onSubmitComment,
    onToggleComments,
  } = props;

  if (!post) return <div className="empty-state">Post not found.</div>;

  return (
    <>
      <div className="toolbar simple-toolbar page-toolbar user-page-toolbar">
        <div>
          <p className="section-label">Post Detail</p>
          <h2>{post.author?.nickname ?? 'Post'}</h2>
        </div>
      </div>
      <div className="post-list">
        <PostCard
          busy={busy}
          commentDraft={commentDraft}
          comments={comments}
          commentsOpen
          favorited={favoritePostIds[post.id] ?? false}
          followed={followingAuthorIds[post.authorId] ?? false}
          highlightedCommentId={highlightedCommentId}
          liked={likedPostIds[post.id] ?? false}
          onCommentDraftChange={onCommentDraftChange}
          onFavorite={onFavorite}
          onFollow={onFollow}
          onLike={onLike}
          onOpenAuthor={onOpenAuthor}
          onSubmitComment={onSubmitComment}
          onToggleComments={onToggleComments}
          post={post}
        />
      </div>
    </>
  );
}


