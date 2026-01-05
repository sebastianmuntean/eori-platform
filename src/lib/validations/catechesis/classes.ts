import { z } from 'zod';

export const createCatechesisClassSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  teacherId: z.string().uuid().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxStudents: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCatechesisClassSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  grade: z.string().max(50).optional().nullable(),
  teacherId: z.string().uuid().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  maxStudents: z.number().int().min(1).optional().nullable(),
  isActive: z.boolean().optional(),
});



