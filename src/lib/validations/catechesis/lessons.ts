import { z } from 'zod';

export const createCatechesisLessonSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  classId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  orderIndex: z.number().int().optional().default(0),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  isPublished: z.boolean().optional().default(false),
});

export const updateCatechesisLessonSchema = z.object({
  classId: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
  durationMinutes: z.number().int().min(1).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const assignLessonToClassSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  orderIndex: z.number().int().optional().default(0),
});



