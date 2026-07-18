import { z } from 'zod';

const userRoleEnum = z.enum(['episcop', 'vicar', 'paroh', 'secretar', 'contabil']);
const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected']);

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: userRoleEnum.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  approvalStatus: approvalStatusEnum.optional().default('pending'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  role: userRoleEnum.optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  approvalStatus: approvalStatusEnum.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
