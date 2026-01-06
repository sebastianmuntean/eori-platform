import { z } from 'zod';

export const createOnlineFormSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  emailValidationMode: z.enum(['start', 'end']).optional().default('end'),
  submissionFlow: z.enum(['direct', 'review']).optional().default('review'),
  targetModule: z.enum(['registratura', 'general_register', 'events', 'clients']),
  widgetCode: z.string().min(1).max(100).optional(), // Optional - will be auto-generated if not provided
  successMessage: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
});

export const updateOnlineFormSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  emailValidationMode: z.enum(['start', 'end']).optional(),
  submissionFlow: z.enum(['direct', 'review']).optional(),
  targetModule: z.enum(['registratura', 'general_register', 'events', 'clients']).optional(),
  successMessage: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
});

export const createFormFieldSchema = z.object({
  fieldKey: z.string().min(1, 'Field key is required').max(100),
  fieldType: z.enum(['text', 'email', 'textarea', 'select', 'date', 'number', 'file']),
  label: z.string().min(1, 'Label is required').max(255),
  placeholder: z.string().max(255).optional().nullable(),
  helpText: z.string().optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  validationRules: z.record(z.any()).optional().nullable(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional().nullable(),
  orderIndex: z.number().int().optional().default(0),
});

export const updateFormFieldSchema = z.object({
  fieldKey: z.string().min(1).max(100).optional(),
  fieldType: z.enum(['text', 'email', 'textarea', 'select', 'date', 'number', 'file']).optional(),
  label: z.string().min(1).max(255).optional(),
  placeholder: z.string().max(255).optional().nullable(),
  helpText: z.string().optional().nullable(),
  isRequired: z.boolean().optional(),
  validationRules: z.record(z.any()).optional().nullable(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional().nullable(),
  orderIndex: z.number().int().optional(),
});

export const createFieldMappingSchema = z.object({
  fieldKey: z.string().min(1, 'Field key is required').max(100),
  targetTable: z.string().min(1, 'Target table is required').max(100),
  targetColumn: z.string().min(1, 'Target column is required').max(100),
  transformation: z.record(z.any()).optional().nullable(),
});

export const updateFieldMappingSchema = z.object({
  targetTable: z.string().min(1).max(100).optional(),
  targetColumn: z.string().min(1).max(100).optional(),
  transformation: z.record(z.any()).optional().nullable(),
});

export const submitFormSchema = z.object({
  formData: z.record(z.any()),
  email: z.string().email('Invalid email address').optional(),
});

export const validateEmailSchema = z.object({
  submissionId: z.string().uuid('Invalid submission ID'),
  email: z.string().email('Invalid email address'),
  code: z.string().min(1, 'Validation code is required').max(10),
});

export type CreateOnlineFormInput = z.infer<typeof createOnlineFormSchema>;
export type UpdateOnlineFormInput = z.infer<typeof updateOnlineFormSchema>;
export type CreateFormFieldInput = z.infer<typeof createFormFieldSchema>;
export type UpdateFormFieldInput = z.infer<typeof updateFormFieldSchema>;
export type CreateFieldMappingInput = z.infer<typeof createFieldMappingSchema>;
export type UpdateFieldMappingInput = z.infer<typeof updateFieldMappingSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type ValidateEmailInput = z.infer<typeof validateEmailSchema>;




