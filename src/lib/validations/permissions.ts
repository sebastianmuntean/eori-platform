import { z } from 'zod';

/**
 * Schema for permissions API response validation
 */
export const permissionsResponseSchema = z.object({
  success: z.boolean(),
  permissions: z.array(z.string()).optional(),
  error: z.string().optional(),
});

export type PermissionsResponse = z.infer<typeof permissionsResponseSchema>;

/**
 * Schema for permission string validation
 * Format: module.resource.action (e.g., 'hr.employees.view')
 */
export const permissionStringSchema = z.string()
  .min(1, 'Permission cannot be empty')
  .regex(/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/, 'Invalid permission format. Expected: module.resource.action')
  .transform((val) => val.trim().toLowerCase());






