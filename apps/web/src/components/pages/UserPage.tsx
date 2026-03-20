import { ProfileHeader } from '../profile/ProfileHeader';
import { PostCard } from '../PostCard';
import type { Comment, Post, UserProfile } from '../../types/app';

type UserPageProps = {
  busy: string;
  commentDrafts: Record<string, string>;
  commentsByPost: Record<string, Comment[]>;
  expandedComments: Record<string, boolean>;
  favoritePostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  likedPostIds: Record<string, boolean>;
  posts: Post[];
  profile: UserProfile | null;
  onCommentDraftChange: (postId: string, value: string) => void;
  onFavorite: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onLike: (postId: string) => void;
  onOpenAuthor: (authorId: string) => void;
  onOpenPost: (postId: string) => void;
  onSubmitComment: (postId: string, parentId?: string) => void;
  onToggleComments: (postId: string) => void;
};

function resolveAvatarUrl(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'}`.replace(/\/api$/, '') + path;
}

export function UserPage(props: UserPageProps) {
  const {
    busy,
    commentDrafts,
    commentsByPost,
    expandedComments,
    favoritePostIds,
    followingAuthorIds,
    likedPostIds,
    posts,
    profile,
    onCommentDraftChange,
    onFavorite,
    onFollow,
    onLike,
    onOpenAuthor,
    onSubmitComment,
    onToggleComments,
  } = props;

  if (!profile) return <div className="empty-state">User not found.</div>;

  return (
    <>
      <ProfileHeader
        avatarPreview={resolveAvatarUrl(profile.avatarUrl)}
        heading="User"
        profile={profile}
        subtitle={profile.bio || 'This user has not added a bio yet.'}
      />
      <div className="toolbar simple-toolbar page-toolbar user-page-toolbar">
        <div>
          <p className="section-label">Public Posts</p>
          <h2>{posts.length ? `${posts.length} posts` : 'No posts yet'}</h2>
        </div>
        <button
          className={followingAuthorIds[profile.id] ? 'ghost-button active-action' : 'ghost-button'}
          disabled={busy === `follow:${profile.id}`}
          onClick={() => onFollow(profile.id)}
          type="button"
        >
          {followingAuthorIds[profile.id] ? 'Following' : 'Follow'}
        </button>
      </div>
      <div className="post-list">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              busy={busy}
              commentDraft={commentDrafts[post.id] ?? ''}
              comments={commentsByPost[post.id] ?? []}
              commentsOpen={expandedComments[post.id] ?? false}
              favorited={favoritePostIds[post.id] ?? false}
              followed={followingAuthorIds[post.authorId] ?? false}
              key={post.id}
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
          ))
        ) : (
          <div className="empty-state">This user has not published anything yet.</div>
        )}
      </div>
    </>
  );
}


