import { z } from 'zod';

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(120),
  }),
});

export const addMemberSchema = z.object({
  body: z.object({
    userId: z.string().optional(),
    email: z.string().email('Valid user email required').optional(),
    role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
  }).refine((data) => data.userId || data.email, {
    message: 'Either userId or email must be provided to add a member',
  }),
});
