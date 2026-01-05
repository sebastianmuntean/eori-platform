import { z } from 'zod';

export const createCatechesisEnrollmentSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  studentId: z.string().uuid('Invalid student ID'),
  status: z.enum(['active', 'completed', 'withdrawn']).optional().default('active'),
  notes: z.string().optional().nullable(),
});

export const updateCatechesisEnrollmentSchema = z.object({
  status: z.enum(['active', 'completed', 'withdrawn']).optional(),
  notes: z.string().optional().nullable(),
});



