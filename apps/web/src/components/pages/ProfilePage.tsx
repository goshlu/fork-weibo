import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { PostCard } from '../PostCard';
import type { Comment, FavoriteItem, Post, ProfileFormState, UserProfile } from '../../types/app';

type ProfileTab = 'published' | 'favorites';

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

type CropState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

const initialCrop: CropState = {
  scale: 1,
  offsetX: 50,
  offsetY: 50,
};

async function cropAvatar(file: File, crop: CropState): Promise<File> {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error('Failed to read avatar image.'));
      nextImage.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas is not available in this browser.');
    }

    const minSide = Math.min(image.width, image.height);
    const visibleSide = minSide / crop.scale;
    const maxLeft = Math.max(0, image.width - visibleSide);
    const maxTop = Math.max(0, image.height - visibleSide);
    const left = (crop.offsetX / 100) * maxLeft;
    const top = (crop.offsetY / 100) * maxTop;

    context.drawImage(image, left, top, visibleSide, visibleSide, 0, 0, 512, 512);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) {
          reject(new Error('Failed to export avatar preview.'));
          return;
        }
        resolve(nextBlob);
      }, 'image/jpeg', 0.92);
    });

    return new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

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

  const [activeTab, setActiveTab] = useState<ProfileTab>('published');
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [crop, setCrop] = useState<CropState>(initialCrop);
  const [localPreview, setLocalPreview] = useState('');

  useEffect(() => {
    if (!pendingAvatar) {
      setLocalPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(pendingAvatar);
    setLocalPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingAvatar]);

  if (!profile) {
    return <div className="empty-state">Log in to view your profile.</div>;
  }

  const previewSrc = localPreview || avatarPreview;

  async function handleAvatarSubmit() {
    if (!pendingAvatar) return;
    const croppedFile = await cropAvatar(pendingAvatar, crop);
    onUploadAvatar(croppedFile);
    setPendingAvatar(null);
    setCrop(initialCrop);
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
            <div className="avatar-shell avatar-shell-large">
              {previewSrc ? (
                <img
                  alt={profile.nickname}
                  className="avatar-image"
                  src={previewSrc}
                  style={
                    localPreview
                      ? {
                          transform: `scale(${crop.scale})`,
                          transformOrigin: `${crop.offsetX}% ${crop.offsetY}%`,
                        }
                      : undefined
                  }
                />
              ) : (
                <span>{profile.nickname.slice(0, 1).toUpperCase()}</span>
              )}
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
                  if (file) {
                    setPendingAvatar(file);
                    setCrop(initialCrop);
                  }
                }}
                type="file"
              />
            </label>
            {pendingAvatar ? (
              <div className="crop-panel">
                <label>
                  Zoom
                  <input
                    max="2.5"
                    min="1"
                    onChange={(event) => setCrop((prev) => ({ ...prev, scale: Number(event.target.value) }))}
                    step="0.05"
                    type="range"
                    value={crop.scale}
                  />
                </label>
                <label>
                  Horizontal
                  <input
                    max="100"
                    min="0"
                    onChange={(event) => setCrop((prev) => ({ ...prev, offsetX: Number(event.target.value) }))}
                    type="range"
                    value={crop.offsetX}
                  />
                </label>
                <label>
                  Vertical
                  <input
                    max="100"
                    min="0"
                    onChange={(event) => setCrop((prev) => ({ ...prev, offsetY: Number(event.target.value) }))}
                    type="range"
                    value={crop.offsetY}
                  />
                </label>
                <div className="post-actions">
                  <button className="primary-button" disabled={busy === 'avatar'} onClick={() => void handleAvatarSubmit()} type="button">
                    {busy === 'avatar' ? 'Uploading avatar...' : 'Apply cropped avatar'}
                  </button>
                  <button onClick={() => { setPendingAvatar(null); setCrop(initialCrop); }} type="button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
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
              {busy === 'profile' ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </div>

        <div className="profile-section">
          <div className="inline-head">
            <h3>Content Library</h3>
            <div className="segmented-inline">
              <button className={activeTab === 'published' ? 'active' : ''} onClick={() => setActiveTab('published')} type="button">
                Published {posts.length}
              </button>
              <button className={activeTab === 'favorites' ? 'active' : ''} onClick={() => setActiveTab('favorites')} type="button">
                Favorites {favorites.length}
              </button>
            </div>
          </div>
          {activeTab === 'favorites' ? (
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
          ) : (
            <div className="post-list compact-list">
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
          )}
        </div>
      </div>
    </>
  );
}
