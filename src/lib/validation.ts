import { z } from 'zod';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

/**
 * Sanitize object strings recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeString(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      (sanitized as any)[key] = sanitizeObject(sanitized[key] as Record<string, any>);
    }
  }

  return sanitized;
}

/**
 * Common validation schemas
 */
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Validate and sanitize input using Zod schema
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  console.log('Step 1: Validating and sanitizing input');

  const result = schema.safeParse(data);

  if (!result.success) {
    console.log(`❌ Validation failed: ${result.error.issues.map(i => i.message).join(', ')}`);
    return {
      success: false,
      error: result.error.issues[0]?.message || 'Validation failed',
      issues: result.error.issues,
    };
  }

  // Sanitize string fields
  if (typeof result.data === 'object' && result.data !== null) {
    const sanitized = sanitizeObject(result.data as Record<string, any>);
    console.log('✓ Input validated and sanitized');
    return { success: true, data: sanitized as T };
  }

  console.log('✓ Input validated');
  return { success: true, data: result.data };
}




