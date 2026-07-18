import { z } from 'zod';
import { ClientFormData } from '@/components/accounting/ClientForm';

interface ValidationErrors {
  [key: string]: string;
}

export const createClientSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  cnp: z.string()
    .refine((val) => !val || val.length === 13, 'CNP must be exactly 13 digits')
    .refine((val) => !val || /^\d{13}$/.test(val), 'CNP must contain only digits')
    .optional(),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  companyName: z.string().max(255).optional(),
  cui: z.string().max(20).optional(),
  regCom: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email format').optional().nullable(),
  bankName: z.string().max(255).optional(),
  iban: z.string()
    .max(34)
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/i, 'Invalid IBAN format')
    .transform((val) => val.toUpperCase())
    .optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateClientSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  cnp: z.string()
    .refine((val) => !val || val.length === 13, 'CNP must be exactly 13 digits')
    .refine((val) => !val || /^\d{13}$/.test(val), 'CNP must contain only digits')
    .optional(),
  birthDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birth date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  companyName: z.string().max(255).optional(),
  cui: z.string().max(20).optional(),
  regCom: z.string().max(50).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  county: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email format').optional().nullable(),
  bankName: z.string().max(255).optional(),
  iban: z.string()
    .max(34)
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/i, 'Invalid IBAN format')
    .transform((val) => val.toUpperCase())
    .optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/**
 * Validate client form data
 */
export function validateClientForm(
  formData: ClientFormData,
  clientType: 'person' | 'company' | 'organization',
  t: (key: string) => string
): ValidationErrors {
  const errors: ValidationErrors = {};

  // Code is always required
  if (!formData.code.trim()) {
    errors.code = `${t('code')} ${t('required') || 'is required'}`;
  }

  // Type-specific validations
  if (clientType === 'person') {
    if (!formData.firstName?.trim() && !formData.lastName?.trim()) {
      errors.firstName = `${t('firstName') || 'First Name'} ${t('or') || 'or'} ${t('lastName') || 'Last Name'} ${t('required') || 'is required'}`;
    }
  } else if (clientType === 'company') {
    if (!formData.companyName?.trim()) {
      errors.companyName = `${t('companyName') || 'Company Name'} ${t('required') || 'is required'}`;
    }
  }

  // Email validation
  if (formData.email && formData.email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = t('invalidEmail') || 'Invalid email format';
    }
  }

  // CNP validation (Romanian Personal Numeric Code - 13 digits)
  if (formData.cnp && formData.cnp.length !== 13) {
    errors.cnp = t('cnpMustBe13Digits') || 'CNP must be 13 digits';
  }

  return errors;
}







