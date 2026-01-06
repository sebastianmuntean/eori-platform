import { z } from 'zod';

export const createCatechesisStudentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  dateOfBirth: z.string().optional().nullable(),
  parentName: z.string().max(255).optional().nullable(),
  parentEmail: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  parentPhone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCatechesisStudentSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  dateOfBirth: z.string().optional().nullable(),
  parentName: z.string().max(255).optional().nullable(),
  parentEmail: z.string().email().optional().nullable().or(z.literal('')),
  parentPhone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});







