import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    projectId: z.string().min(1, 'Project ID is required'),
    title: z.string().min(1, 'Task title is required').max(200),
    description: z.string().max(5000).optional().default(''),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional().default('TODO'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
    assigneeId: z.string().nullable().optional(),
    labels: z.array(z.string()).optional().default([]),
    dueDate: z.string().nullable().optional(),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assigneeId: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
    dueDate: z.string().nullable().optional(),
    version: z.number().int().optional(),
  }),
});

export const queryTaskSchema = z.object({
  query: z.object({
    projectId: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignee: z.string().optional(),
    labels: z.string().optional(), // Comma-separated or single label
    dueDate: z.string().optional(), // YYYY-MM-DD
    createdDate: z.string().optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});
