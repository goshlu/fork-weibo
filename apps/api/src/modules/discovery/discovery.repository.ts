import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { SearchTrendStore } from './discovery.types.js';

const seedData: SearchTrendStore = {
  keywords: [],
};

export class DiscoveryRepository {
  constructor(private readonly filePath: string) {}

  async read(): Promise<SearchTrendStore> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as Partial<SearchTrendStore>;
      return {
        keywords: parsed.keywords ?? [],
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

  async write(data: SearchTrendStore): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async update<T>(updater: (data: SearchTrendStore) => T): Promise<T> {
    const data = await this.read();
    const result = updater(data);
    await this.write(data);
    return result;
  }
}
