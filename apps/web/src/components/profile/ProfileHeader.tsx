import type { UserProfile } from '../../types/app';
import { useI18n } from '../../i18n';

type ProfileHeaderProps = {
  avatarPreview: string;
  heading?: string;
  profile: UserProfile;
  subtitle?: string;
};

export function ProfileHeader({ avatarPreview, heading, profile, subtitle }: ProfileHeaderProps) {
  const { dictionary } = useI18n();
  const texts = dictionary.profile;
  const resolvedHeading = heading ?? texts.profile;

  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">{resolvedHeading}</p>
          <h2>{profile.nickname}</h2>
        </div>
      </div>

      <div className="profile-card profile-header-card">
        <div className="profile-header">
          <div className="avatar-shell avatar-shell-large">
            {avatarPreview ? (
              <img alt={profile.nickname} className="avatar-image" src={avatarPreview} />
            ) : (
              <span>{profile.nickname.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="profile-main">
            <strong>@{profile.username}</strong>
            <p>{(subtitle ?? profile.bio) || texts.noBio}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div><span>{texts.followers}</span><strong>{profile.stats.followers}</strong></div>
          <div><span>{texts.following}</span><strong>{profile.stats.following}</strong></div>
          <div><span>{texts.posts}</span><strong>{profile.stats.posts}</strong></div>
          <div><span>{texts.likes}</span><strong>{profile.stats.likesReceived}</strong></div>
        </div>
      </div>
    </>
  );
}
