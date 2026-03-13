import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { z } from 'zod';

import type { UserRepository } from './user.repository.js';
import type { PublicUser, UserProfile, UserRecord } from './user.types.js';
import { type loginSchema, type registerSchema, type updateUserSchema } from './user.schemas.js';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async register(input: z.infer<typeof registerSchema>): Promise<PublicUser> {
    const existed = await this.repository.findByUsername(input.username);
    if (existed) {
      throw new Error('USERNAME_EXISTS');
    }

    const now = new Date().toISOString();
    const user: UserRecord = {
      id: randomUUID(),
      username: input.username,
      nickname: input.nickname,
      bio: input.bio ?? '',
      passwordHash: await bcrypt.hash(input.password, 10),
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.insert(user);
    return this.toPublicUser(user);
  }

  async login(input: z.infer<typeof loginSchema>): Promise<PublicUser> {
    const user = await this.repository.findByUsername(input.username);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const matched = await bcrypt.compare(input.password, user.passwordHash);
    if (!matched) {
      throw new Error('INVALID_CREDENTIALS');
    }

    return this.toPublicUser(user);
  }

  async getPublicUser(id: string): Promise<PublicUser | undefined> {
    const user = await this.repository.findById(id);
    return user ? this.toPublicUser(user) : undefined;
  }

  async updateUser(
    id: string,
    input: z.infer<typeof updateUserSchema>,
  ): Promise<PublicUser | undefined> {
    const updated = await this.repository.update(id, (user: UserRecord) => ({
      ...user,
      nickname: input.nickname ?? user.nickname,
      bio: input.bio ?? user.bio,
      passwordHash: input.password ? bcrypt.hashSync(input.password, 10) : user.passwordHash,
      updatedAt: new Date().toISOString(),
    }));

    return updated ? this.toPublicUser(updated) : undefined;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<PublicUser | undefined> {
    const updated = await this.repository.update(id, (user: UserRecord) => ({
      ...user,
      avatarUrl,
      updatedAt: new Date().toISOString(),
    }));

    return updated ? this.toPublicUser(updated) : undefined;
  }

  async getProfile(id: string): Promise<UserProfile | undefined> {
    const user = await this.repository.findById(id);
    if (!user) {
      return undefined;
    }

    return {
      ...this.toPublicUser(user),
      stats: {
        followers: 0,
        following: 0,
        posts: 0,
        likesReceived: 0,
      },
    };
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
