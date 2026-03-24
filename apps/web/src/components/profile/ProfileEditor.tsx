import type { Dispatch, SetStateAction } from 'react';

import { useI18n } from '../../i18n';
import type { ProfileFormState } from '../../types/app';

type CropState = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

type ProfileEditorProps = {
  avatarPreview: string;
  busy: string;
  crop: CropState;
  pendingAvatar: File | null;
  profileForm: ProfileFormState;
  onApplyAvatar: () => void;
  onAvatarPick: (file: File) => void;
  onCancelAvatar: () => void;
  onCropChange: Dispatch<SetStateAction<CropState>>;
  onProfileFormChange: Dispatch<SetStateAction<ProfileFormState>>;
  onSaveProfile: () => void;
};

export function ProfileEditor(props: ProfileEditorProps) {
  const { dictionary } = useI18n();
  const texts = dictionary.profile;
  const {
    avatarPreview,
    busy,
    crop,
    pendingAvatar,
    profileForm,
    onApplyAvatar,
    onAvatarPick,
    onCancelAvatar,
    onCropChange,
    onProfileFormChange,
    onSaveProfile,
  } = props;

  return (
    <div className="profile-card">
      <div className="stack-form compact-form">
        <label>
          {texts.avatar}
          <input
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAvatarPick(file);
            }}
            type="file"
          />
        </label>
        {pendingAvatar ? (
          <div className="crop-panel">
            <div className="avatar-shell avatar-shell-large avatar-preview-shell">
              {avatarPreview ? (
                <img
                  alt={texts.avatarPreview}
                  className="avatar-image"
                  src={avatarPreview}
                  style={{
                    transform: `scale(${crop.scale})`,
                    transformOrigin: `${crop.offsetX}% ${crop.offsetY}%`,
                  }}
                />
              ) : null}
            </div>
            <label>
              {texts.zoom}
              <input max="2.5" min="1" onChange={(event) => onCropChange((prev) => ({ ...prev, scale: Number(event.target.value) }))} step="0.05" type="range" value={crop.scale} />
            </label>
            <label>
              {texts.horizontal}
              <input max="100" min="0" onChange={(event) => onCropChange((prev) => ({ ...prev, offsetX: Number(event.target.value) }))} type="range" value={crop.offsetX} />
            </label>
            <label>
              {texts.vertical}
              <input max="100" min="0" onChange={(event) => onCropChange((prev) => ({ ...prev, offsetY: Number(event.target.value) }))} type="range" value={crop.offsetY} />
            </label>
            <div className="post-actions">
              <button className="primary-button" disabled={busy === 'avatar'} onClick={onApplyAvatar} type="button">
                {busy === 'avatar' ? texts.uploadingAvatar : texts.applyCroppedAvatar}
              </button>
              <button onClick={onCancelAvatar} type="button">{texts.cancel}</button>
            </div>
          </div>
        ) : null}
        <label>
          {texts.nickname}
          <input value={profileForm.nickname} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, nickname: event.target.value }))} />
        </label>
        <label>
          {texts.bio}
          <textarea rows={3} value={profileForm.bio} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, bio: event.target.value }))} />
        </label>
        <label>
          {texts.newPassword}
          <input type="password" value={profileForm.password} onChange={(event) => onProfileFormChange((prev) => ({ ...prev, password: event.target.value }))} placeholder={texts.keepPasswordHint} />
        </label>
        <button className="primary-button" disabled={busy === 'profile' || busy === 'avatar'} onClick={onSaveProfile} type="button">
          {busy === 'profile' ? texts.saving : texts.saveProfile}
        </button>
      </div>
    </div>
  );
}
