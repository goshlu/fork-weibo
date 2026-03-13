import type { Dispatch, SetStateAction } from 'react';

import { PostCard } from '../PostCard';
import type { Comment, FavoriteItem, Post, ProfileFormState, UserProfile } from '../../types/app';

type ProfilePageProps = {
  avatarPreview: string;
  busy: string;
  favorites: FavoriteItem[];
  profile: UserProfile | null;
  profileForm: ProfileFormState;
  posts: Post[];
  likedPostIds: Record<string, boolean>;
  favoritePostIds: Record<string, boolean>;
  followingAuthorIds: Record<string, boolean>;
  commentsByPost: Record<string, Comment[]>;
  commentDrafts: Record<string, string>;
  expandedComments: Record<string, boolean>;
  onFavorite: (postId: string) => void;
  onLike: (postId: string) => void;
  onFollow: (authorId: string) => void;
  onToggleComments: (postId: string) => void;
  onCommentDraftChange: (postId: string, value: string) => void;
  onProfileFormChange: Dispatch<SetStateAction<ProfileFormState>>;
  onSaveProfile: () => void;
  onSubmitComment: (postId: string) => void;
  onUploadAvatar: (file: File) => void;
};

export function ProfilePage(props: ProfilePageProps) {
  const {
    avatarPreview,
    busy,
    favorites,
    profile,
    profileForm,
    posts,
    likedPostIds,
    favoritePostIds,
    followingAuthorIds,
    commentsByPost,
    commentDrafts,
    expandedComments,
    onFavorite,
    onLike,
    onFollow,
    onToggleComments,
    onCommentDraftChange,
    onProfileFormChange,
    onSaveProfile,
    onSubmitComment,
    onUploadAvatar,
  } = props;

  if (!profile) {
    return <div className="empty-state">Log in to view your profile.</div>;
  }

  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">Profile</p>
          <h2>{profile.nickname}</h2>
        </div>
      </div>

      <div className="profile-layout">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar-shell">
              {avatarPreview ? <img alt={profile.nickname} className="avatar-image" src={avatarPreview} /> : <span>{profile.nickname.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="profile-main">
              <strong>@{profile.username}</strong>
              <p>{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
          <div className="profile-stats">
            <div><span>Followers</span><strong>{profile.stats.followers}</strong></div>
            <div><span>Following</span><strong>{profile.stats.following}</strong></div>
            <div><span>Posts</span><strong>{profile.stats.posts}</strong></div>
            <div><span>Likes</span><strong>{profile.stats.likesReceived}</strong></div>
          </div>
          <div className="stack-form compact-form">
            <label>
              Avatar
              <input
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadAvatar(file);
                }}
                type="file"
              />
            </label>
            <label>
              Nickname
              <input value={profileForm.nickname} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, nickname: event.target.value }))} />
            </label>
            <label>
              Bio
              <textarea rows={3} value={profileForm.bio} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, bio: event.target.value }))} />
            </label>
            <label>
              New password
              <input type="password" value={profileForm.password} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, password: event.target.value }))} placeholder="Leave blank to keep current password" />
            </label>
            <button className="primary-button" disabled={busy === 'profile' || busy === 'avatar'} onClick={onSaveProfile} type="button">
              {busy === 'profile' ? 'Saving...' : busy === 'avatar' ? 'Uploading avatar...' : 'Save profile'}
            </button>
          </div>
        </div>

        <div className="profile-section">
          <div className="inline-head">
            <h3>Favorites</h3>
            <span>{favorites.length}</span>
          </div>
          <div className="compact-list">
            {favorites.length ? (
              favorites.map((item) => (
                <article className="favorite-card" key={`${item.postId}:${item.folderName}`}>
                  <div className="post-meta">
                    <span>{item.folderName}</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{item.post.content}</p>
                  <div className="post-actions">
                    <button className="active-action" disabled={busy === `favorite:${item.postId}`} onClick={() => onFavorite(item.postId)} type="button">
                      Unfavorite
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">No favorites yet.</div>
            )}
          </div>
        </div>
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
