import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'q is required').max(100, 'q is too long'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
});

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(20).default(10),
});
