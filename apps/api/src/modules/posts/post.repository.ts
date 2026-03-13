import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { PostRecord } from './post.types.js';

const seedData = { posts: [] as PostRecord[] };

export class PostRepository {
  constructor(private readonly filePath: string) {}

  async list(): Promise<PostRecord[]> {
    const data = await this.read();
    return data.posts;
  }

  async findById(id: string): Promise<PostRecord | undefined> {
    const posts = await this.list();
    return posts.find((post) => post.id === id);
  }

  async insert(post: PostRecord): Promise<PostRecord> {
    const data = await this.read();
    data.posts.push(post);
    await this.write(data.posts);
    return post;
  }

  async update(
    id: string,
    updater: (post: PostRecord) => PostRecord,
  ): Promise<PostRecord | undefined> {
    const data = await this.read();
    const index = data.posts.findIndex((post) => post.id === id);
    if (index === -1) {
      return undefined;
    }

    data.posts[index] = updater(data.posts[index]);
    await this.write(data.posts);
    return data.posts[index];
  }

  async delete(id: string): Promise<boolean> {
    const data = await this.read();
    const nextPosts = data.posts.filter((post) => post.id !== id);
    if (nextPosts.length === data.posts.length) {
      return false;
    }

    await this.write(nextPosts);
    return true;
  }

  private async read(): Promise<{ posts: PostRecord[] }> {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as { posts?: PostRecord[] };
      return {
        posts: parsed.posts ?? [],
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        await this.write(seedData.posts);
        return seedData;
      }
      throw error;
    }
  }

  private async write(posts: PostRecord[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify({ posts }, null, 2));
  }
}
