import { z } from 'zod';

/**
 * Schema for creating a new deanery (protopopiat)
 */
export const createDeanerySchema = z.object({
  dioceseId: z.string().uuid('ID-ul diecezei nu este valid'),
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
  deanName: z.string().max(255).optional().nullable(), // Protopop
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
  isActive: z.boolean().default(true),
});

/**
 * Schema for updating an existing deanery
 */
export const updateDeanerySchema = createDeanerySchema.partial().omit({ dioceseId: true });

/**
 * Schema for deanery query parameters
 */
export const deaneryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  dioceseId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['code', 'name', 'city', 'deanName', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateDeaneryInput = z.infer<typeof createDeanerySchema>;
export type UpdateDeaneryInput = z.infer<typeof updateDeanerySchema>;
export type DeaneryQueryParams = z.infer<typeof deaneryQuerySchema>;
