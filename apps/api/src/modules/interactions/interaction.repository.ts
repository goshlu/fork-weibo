import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { InteractionStore } from './interaction.types.js';

const seedData: InteractionStore = {
  likes: [],
  favorites: [],
  comments: [],
  follows: [],
  notifications: [],
};

export class InteractionRepository {
  constructor(private readonly filePath: string) {}

  async read(): Promise<InteractionStore> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as Partial<InteractionStore>;
      return {
        likes: parsed.likes ?? [],
        favorites: parsed.favorites ?? [],
        comments: parsed.comments ?? [],
        follows: parsed.follows ?? [],
        notifications: parsed.notifications ?? [],
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        await this.write(seedData);
        return seedData;
      }
      throw error;
    }
  }

  async write(data: InteractionStore): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async update<T>(updater: (data: InteractionStore) => T): Promise<T> {
    const data = await this.read();
    const result = updater(data);
    await this.write(data);
    return result;
  }
}
