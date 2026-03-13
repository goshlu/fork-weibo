import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';

import { env } from '../../config/env.js';
import { toErrorResponse } from '../../utils/http.js';
import { createPostSchema, listPostsQuerySchema, updatePostSchema } from './post.schemas.js';
import type { PostService } from './post.service.js';
import type { PostImage } from './post.types.js';

async function saveUploadedImages(
  parts: AsyncIterableIterator<MultipartFile>,
  postOwnerId: string,
): Promise<PostImage[]> {
  const images: PostImage[] = [];
  let index = 0;

  for await (const part of parts) {
    if (!part.mimetype.startsWith('image/')) {
      throw new Error('INVALID_IMAGE');
    }

    if (index >= 9) {
      throw new Error('TOO_MANY_IMAGES');
    }

    const extension = path.extname(part.filename || '').toLowerCase() || '.bin';
    const uploadDir = path.join(process.cwd(), env.UPLOAD_DIR, 'posts', postOwnerId);
    await mkdir(uploadDir, { recursive: true });
    const fileName = `post-${Date.now()}-${index}${extension}`;
    const destination = path.join(uploadDir, fileName);
    await pipeline(part.file, createWriteStream(destination));

    images.push({
      url: `/uploads/posts/${postOwnerId}/${fileName}`,
      width: 1440,
      height: 1440,
    });

    index += 1;
  }

  return images;
}

function getRequesterId(request: FastifyRequest): string | undefined {
  return request.user?.userId;
}

export async function registerPostRoutes(
  app: FastifyInstance,
  postService: PostService,
): Promise<void> {
  app.post('/api/posts', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const isMultipart = request.isMultipart();
      let payload: unknown = request.body;
      let images: PostImage[] = [];

      if (isMultipart) {
        const parts = request.parts();
        let content = '';
        let status: 'draft' | 'published' = 'published';
        const files: MultipartFile[] = [];

        for await (const part of parts) {
          if (part.type === 'file') {
            files.push(part);
            continue;
          }

          if (part.fieldname === 'content') {
            content = String(part.value ?? '');
          }

          if (
            part.fieldname === 'status' &&
            (part.value === 'draft' || part.value === 'published')
          ) {
            status = part.value;
          }
        }

        async function* iterateFiles() {
          for (const file of files) {
            yield file;
          }
        }

        images = await saveUploadedImages(iterateFiles(), request.user.userId);
        payload = { content, status };
      }

      const parsed = createPostSchema.parse(payload);
      const post = await postService.createPost(request.user.userId, parsed, images);
      return reply.code(201).send({ post });
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/posts', { preHandler: [app.authenticateOptional] }, async (request, reply) => {
    try {
      const query = listPostsQuerySchema.parse(request.query);
      const result = await postService.listPosts(query, getRequesterId(request));
      return result;
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.get('/api/posts/:id', { preHandler: [app.authenticateOptional] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const post = await postService.getPostById(params.id, getRequesterId(request));
      if (!post) {
        return reply.code(404).send({ message: 'Post not found' });
      }
      return { post };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.patch('/api/posts/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const payload = updatePostSchema.parse(request.body);
      const post = await postService.updatePost(params.id, request.user.userId, payload);
      if (!post) {
        return reply.code(404).send({ message: 'Post not found' });
      }
      return { post };
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });

  app.delete('/api/posts/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const removed = await postService.deletePost(params.id, request.user.userId);
      if (!removed) {
        return reply.code(404).send({ message: 'Post not found' });
      }
      return reply.code(204).send();
    } catch (error) {
      const mapped = toErrorResponse(error);
      return reply.code(mapped.statusCode).send({ message: mapped.message });
    }
  });
}
