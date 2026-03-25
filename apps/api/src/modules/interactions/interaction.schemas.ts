import { z } from 'zod';

export const favoriteSchema = z.object({
  folderName: z.string().min(1, 'folderName is required').max(30, 'folderName is too long'),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'content is required').max(500, 'content is too long'),
  parentId: z.string().optional(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
