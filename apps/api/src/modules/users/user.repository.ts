import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { UserRecord } from './user.types.js';

const seedData = { users: [] as UserRecord[] };

export class UserRepository {
  constructor(private readonly filePath: string) {}

  async list(): Promise<UserRecord[]> {
    const data = await this.read();
    return data.users;
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const users = await this.list();
    return users.find((user) => user.id === id);
  }

  async findByUsername(username: string): Promise<UserRecord | undefined> {
    const users = await this.list();
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  async insert(user: UserRecord): Promise<UserRecord> {
    const data = await this.read();
    data.users.push(user);
    await this.write(data.users);
    return user;
  }

  async update(
    id: string,
    updater: (user: UserRecord) => UserRecord,
  ): Promise<UserRecord | undefined> {
    const data = await this.read();
    const index = data.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return undefined;
    }

    data.users[index] = updater(data.users[index]);
    await this.write(data.users);
    return data.users[index];
  }

  private async read(): Promise<{ users: UserRecord[] }> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as { users?: UserRecord[] };
      return {
        users: parsed.users ?? [],
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        await this.write(seedData.users);
        return seedData;
      }
      throw error;
    }
  }

  private async write(users: UserRecord[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify({ users }, null, 2));
  }
}
