import { z } from 'zod';

/**
 * Schema for assigning a user to a parish
 */
export const createUserParishSchema = z.object({
  userId: z.string().uuid('ID-ul utilizatorului nu este valid'),
  parishId: z.string().uuid('ID-ul parohiei nu este valid'),
  isPrimary: z.boolean().default(false),
  accessLevel: z.enum(['full', 'readonly', 'limited']).default('full'),
});

/**
 * Schema for updating a user-parish assignment
 */
export const updateUserParishSchema = z.object({
  isPrimary: z.boolean().optional(),
  accessLevel: z.enum(['full', 'readonly', 'limited']).optional(),
});

/**
 * Schema for user-parishes query parameters
 */
export const userParishQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  parishId: z.string().uuid().optional(),
});

export type CreateUserParishInput = z.infer<typeof createUserParishSchema>;
export type UpdateUserParishInput = z.infer<typeof updateUserParishSchema>;
export type UserParishQueryParams = z.infer<typeof userParishQuerySchema>;
