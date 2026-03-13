export interface UserRecord {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  passwordHash: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends PublicUser {
  stats: {
    followers: number;
    following: number;
    posts: number;
    likesReceived: number;
  };
}
