import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Comment content cannot be empty').max(2000),
    mentions: z.array(z.string()).optional().default([]),
  }),
});
