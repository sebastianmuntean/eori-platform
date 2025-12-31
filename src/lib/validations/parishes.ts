import { z } from 'zod';

/**
 * Schema for creating a new parish (parohie)
 */
export const createParishSchema = z.object({
  dioceseId: z.string().uuid('ID-ul diecezei nu este valid'),
  deaneryId: z.string().uuid('ID-ul protopopiatului nu este valid').optional().nullable(),
  code: z
    .string()
    .min(1, 'Codul este obligatoriu')
    .max(20, 'Codul nu poate depăși 20 caractere')
    .regex(/^[A-Z0-9-]+$/, 'Codul poate conține doar litere mari, cifre și cratimă'),
  name: z
    .string()
    .min(1, 'Denumirea este obligatorie')
    .max(255, 'Denumirea nu poate depăși 255 caractere'),
  patronSaintDay: z.string().optional().nullable(), // Date as string YYYY-MM-DD
  address: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
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
  priestName: z.string().max(255).optional().nullable(), // Paroh
  vicarName: z.string().max(255).optional().nullable(), // Vicar
  parishionerCount: z.coerce.number().int().min(0).optional().nullable(),
  foundedYear: z.coerce.number().int().min(100).max(new Date().getFullYear()).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an existing parish
 */
export const updateParishSchema = createParishSchema.partial().omit({ dioceseId: true });

/**
 * Schema for parish query parameters
 */
export const parishQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dioceseId: z.string().uuid().optional(),
  deaneryId: z.string().uuid().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['code', 'name', 'city', 'county', 'priestName', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateParishInput = z.infer<typeof createParishSchema>;
export type UpdateParishInput = z.infer<typeof updateParishSchema>;
export type ParishQueryParams = z.infer<typeof parishQuerySchema>;
