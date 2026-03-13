import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { ProfileEditor } from '../profile/ProfileEditor';
import { ProfileHeader } from '../profile/ProfileHeader';
import { ProfileLibrary } from '../profile/ProfileLibrary';
import type { Comment, FavoriteItem, Post, ProfileFormState, ProfileTab, UserProfile } from '../../types/app';

type ProfilePageProps = {
  avatarPreview: string;
  busy: string;
  favoriteFolderName: string;
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
  onFavoriteFolderNameChange: (value: string) => void;
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
    if (!context) throw new Error('Canvas is not available in this browser.');

    const minSide = Math.min(image.width, image.height);
    const visibleSide = minSide / crop.scale;
    const maxLeft = Math.max(0, image.width - visibleSide);
    const maxTop = Math.max(0, image.height - visibleSide);
    const left = (crop.offsetX / 100) * maxLeft;
    const top = (crop.offsetY / 100) * maxTop;

    context.drawImage(image, left, top, visibleSide, visibleSide, 0, 0, 512, 512);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (!nextBlob) return reject(new Error('Failed to export avatar preview.'));
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
    favoriteFolderName,
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
    onFavoriteFolderNameChange,
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

  if (!profile) return <div className="empty-state">Log in to view your profile.</div>;

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
      <ProfileHeader avatarPreview={previewSrc} profile={profile} />
      <div className="profile-layout">
        <ProfileEditor
          avatarPreview={previewSrc}
          busy={busy}
          crop={crop}
          pendingAvatar={pendingAvatar}
          profileForm={profileForm}
          onApplyAvatar={() => void handleAvatarSubmit()}
          onAvatarPick={(file) => { setPendingAvatar(file); setCrop(initialCrop); }}
          onCancelAvatar={() => { setPendingAvatar(null); setCrop(initialCrop); }}
          onCropChange={setCrop}
          onProfileFormChange={onProfileFormChange}
          onSaveProfile={onSaveProfile}
        />
        <ProfileLibrary
          activeTab={activeTab}
          busy={busy}
          commentDrafts={commentDrafts}
          commentsByPost={commentsByPost}
          expandedComments={expandedComments}
          favoriteFolderName={favoriteFolderName}
          favoritePostIds={favoritePostIds}
          favorites={favorites}
          followingAuthorIds={followingAuthorIds}
          likedPostIds={likedPostIds}
          onCommentDraftChange={onCommentDraftChange}
          onFavorite={onFavorite}
          onFavoriteFolderNameChange={onFavoriteFolderNameChange}
          onFollow={onFollow}
          onLike={onLike}
          onSubmitComment={onSubmitComment}
          onTabChange={setActiveTab}
          onToggleComments={onToggleComments}
          posts={posts}
        />
      </div>
    </>
  );
}
