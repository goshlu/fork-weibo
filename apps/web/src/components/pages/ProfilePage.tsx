import type { Comment, Post, UserProfile } from '../../types/app';
import { PostCard } from '../PostCard';

type ProfilePageProps = {
  busy: string;
  profile: UserProfile | null;
  posts: Post[];
  likedPostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  commentsByPost: Record<string, Comment[]>;
  commentDrafts: Record<string, string>;
  expandedComments: Record<string, boolean>;
  onLike: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onSubmitComment: (postId: string) => void;
};

export function ProfilePage(props: ProfilePageProps) {
  const {
    busy,
    profile,
    posts,
    likedPostIds,
    followingAuthorIds,
    commentsByPost,
    commentDrafts,
    expandedComments,
    onLike,
    onFollow,
    onToggleComments,
    onCommentDraftChange,
    onSubmitComment,
  } = props;

  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">Profile</p>
          <h2>{profile?.nickname ?? 'Guest'}</h2>
        </div>
      </div>
      {profile ? (
        <div className="profile-card">
          <div className="profile-main">
            <strong>@{profile.username}</strong>
            <p>{profile.bio || 'No bio yet.'}</p>
          </div>
          <div className="profile-stats">
            <div><span>Followers</span><strong>{profile.stats.followers}</strong></div>
            <div><span>Following</span><strong>{profile.stats.following}</strong></div>
            <div><span>Posts</span><strong>{profile.stats.posts}</strong></div>
            <div><span>Likes</span><strong>{profile.stats.likesReceived}</strong></div>
          </div>
        </div>
      ) : (
        <div className="empty-state">Log in to view your profile.</div>
      )}
      <div className="post-list">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              busy={busy}
              commentDraft={commentDrafts[post.id] ?? ''}
              comments={commentsByPost[post.id] ?? []}
              commentsOpen={expandedComments[post.id] ?? false}
              followed={followingAuthorIds[post.authorId] ?? false}
              key={post.id}
              liked={likedPostIds[post.id] ?? false}
              onCommentDraftChange={onCommentDraftChange}
              onFollow={onFollow}
              onLike={onLike}
              onSubmitComment={onSubmitComment}
              onToggleComments={onToggleComments}
              post={post}
            />
          ))
        ) : (
          <div className="empty-state">No published posts yet.</div>
        )}
      </div>
    </>
  );
}