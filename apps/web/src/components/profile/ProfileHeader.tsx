import type { UserProfile } from '../../types/app';

type ProfileHeaderProps = {
  avatarPreview: string;
  heading?: string;
  profile: UserProfile;
  subtitle?: string;
};

export function ProfileHeader({ avatarPreview, heading = 'Profile', profile, subtitle }: ProfileHeaderProps) {
  return (
    <>
      <div className="toolbar simple-toolbar">
        <div>
          <p className="section-label">{heading}</p>
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
            <p>{(subtitle ?? profile.bio) || 'No bio yet.'}</p>
          </div>
        </div>
        <div className="profile-stats">
          <div><span>Followers</span><strong>{profile.stats.followers}</strong></div>
          <div><span>Following</span><strong>{profile.stats.following}</strong></div>
          <div><span>Posts</span><strong>{profile.stats.posts}</strong></div>
          <div><span>Likes</span><strong>{profile.stats.likesReceived}</strong></div>
        </div>
      </div>
    </>
  );
}
