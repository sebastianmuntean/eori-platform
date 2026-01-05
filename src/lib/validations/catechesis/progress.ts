import { z } from 'zod';

export const createCatechesisProgressSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional().default('not_started'),
  timeSpentMinutes: z.number().int().min(0).optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCatechesisProgressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  timeSpentMinutes: z.number().int().min(0).optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const trackProgressSchema = z.object({
  enrollmentId: z.string().uuid('Invalid enrollment ID'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  action: z.enum(['start', 'complete']),
  timeSpentMinutes: z.number().int().min(0).optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
});



