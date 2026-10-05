import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Valid email address is required').toLowerCase().trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password is too long'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email address is required').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
  }),
});
