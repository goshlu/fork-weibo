import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'content is required').max(2000, 'content is too long'),
  status: z.enum(['draft', 'published']).default('published'),
});

export const updatePostSchema = z
  .object({
    content: z.string().min(1).max(2000).optional(),
    status: z.enum(['draft', 'published']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
  sort: z.enum(['latest', 'oldest']).default('latest'),
  status: z.enum(['draft', 'published']).optional(),
  authorId: z.string().optional(),
});
