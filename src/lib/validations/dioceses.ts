import { z } from 'zod';

/**
 * Schema for creating a new diocese
 */
export const createDioceseSchema = z.object({
  code: z
    .string()
    .min(1, 'Codul este obligatoriu')
    .max(20, 'Codul nu poate depăși 20 caractere')
    .regex(/^[A-Z0-9-]+$/, 'Codul poate conține doar litere mari, cifre și cratimă'),
  name: z
    .string()
    .min(1, 'Denumirea este obligatorie')
    .max(255, 'Denumirea nu poate depăși 255 caractere'),
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  country: z.string().max(100).default('România'),
  phone: z
    .string()
    .max(50)
    .regex(/^[+]?[\d\s-()]*$/, 'Număr de telefon invalid')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Adresa de email nu este validă')
    .max(255)
    .optional()
    .nullable(),
  website: z
    .string()
    .url('URL-ul nu este valid')
    .max(255)
    .optional()
    .nullable(),
  bishopName: z.string().max(255).optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an existing diocese
 */
export const updateDioceseSchema = createDioceseSchema.partial();

/**
 * Schema for diocese query parameters
 */
export const dioceseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['code', 'name', 'city', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateDioceseInput = z.infer<typeof createDioceseSchema>;
export type UpdateDioceseInput = z.infer<typeof updateDioceseSchema>;
export type DioceseQueryParams = z.infer<typeof dioceseQuerySchema>;
