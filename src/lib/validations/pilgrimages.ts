import { z } from 'zod';

const pilgrimageStatusEnum = z.enum([
  'draft',
  'open',
  'closed',
  'in_progress',
  'completed',
  'cancelled',
]);

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional()
  .nullable();

export const createPilgrimageSchema = z
  .object({
    parishId: z.string().uuid('Invalid parish ID'),
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    description: z.string().optional().nullable(),
    destination: z.string().max(255).optional().nullable(),
    startDate: dateString,
    endDate: dateString,
    registrationDeadline: dateString,
    maxParticipants: z.number().int().positive().optional().nullable(),
    minParticipants: z.number().int().positive().optional().nullable(),
    status: pilgrimageStatusEnum.optional().default('draft'),
    pricePerPerson: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format')
      .optional()
      .nullable(),
    currency: z.string().length(3).optional().default('RON'),
    organizerName: z.string().max(255).optional().nullable(),
    organizerContact: z.string().max(255).optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    { message: 'End date must be after or equal to start date', path: ['endDate'] }
  )
  .refine(
    (data) => {
      if (
        data.maxParticipants !== null &&
        data.maxParticipants !== undefined &&
        data.minParticipants !== null &&
        data.minParticipants !== undefined
      ) {
        return data.maxParticipants >= data.minParticipants;
      }
      return true;
    },
    {
      message: 'Maximum participants must be greater than or equal to minimum participants',
      path: ['maxParticipants'],
    }
  )
  .refine(
    (data) => {
      if (data.registrationDeadline && data.startDate) {
        return data.registrationDeadline <= data.startDate;
      }
      return true;
    },
    {
      message: 'Registration deadline must be before or equal to start date',
      path: ['registrationDeadline'],
    }
  );

export const updatePilgrimageSchema = z.object({
  parishId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  destination: z.string().max(255).optional().nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  registrationDeadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  minParticipants: z.number().int().positive().optional().nullable(),
  status: pilgrimageStatusEnum.optional(),
  pricePerPerson: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional()
    .nullable(),
  currency: z.string().length(3).optional(),
  organizerName: z.string().max(255).optional().nullable(),
  organizerContact: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreatePilgrimageInput = z.infer<typeof createPilgrimageSchema>;
export type UpdatePilgrimageInput = z.infer<typeof updatePilgrimageSchema>;
