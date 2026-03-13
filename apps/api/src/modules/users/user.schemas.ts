import { z } from 'zod';

const usernameRule = z
  .string()
  .min(3, 'username must be at least 3 characters')
  .max(20, 'username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'username can only contain letters, numbers and underscores');

export const registerSchema = z.object({
  username: usernameRule,
  password: z.string().min(8, 'password must be at least 8 characters'),
  nickname: z.string().min(1).max(30),
  bio: z.string().max(160).optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const updateUserSchema = z
  .object({
    nickname: z.string().min(1).max(30).optional(),
    bio: z.string().max(160).optional(),
    password: z.string().min(8).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'At least one field must be provided');
