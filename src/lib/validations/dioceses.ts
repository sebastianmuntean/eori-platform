import { z } from 'zod';

/**
 * Schema for creating a new diocese
 */
export const createDioceseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  country: z.string().optional().default('România'),
  phone: z.string().optional(),
  email: z.union([
    z.string().email(),
    z.literal(''),
    z.undefined()
  ]).optional(),
  website: z.union([
    z.string().url(),
    z.literal(''),
    z.undefined()
  ]).optional(),
  bishopName: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema for updating a diocese (all fields optional)
 */
export const updateDioceseSchema = createDioceseSchema.partial();

/**
 * Schema for validating UUID diocese ID
 */
export const dioceseIdSchema = z.string().uuid('Invalid diocese ID format');







