import { z } from 'zod';

// Common participant schema
const participantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().max(255).optional(),
  birthDate: z.string().optional().nullable(),
  cnp: z.string().max(13).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

// Wedding form schema
export const weddingFormSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  eventDate: z.string().optional().nullable(),
  location: z.string().max(255).optional(),
  groom: participantSchema,
  bride: participantSchema,
  groomParents: z.object({
    father: participantSchema.optional(),
    mother: participantSchema.optional(),
  }).optional(),
  brideParents: z.object({
    father: participantSchema.optional(),
    mother: participantSchema.optional(),
  }).optional(),
  witnesses: z.array(participantSchema).max(4).optional(),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  contactPhone: z.string().min(1, 'Contact phone is required').max(50),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().optional(),
});

// Baptism form schema
export const baptismFormSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  eventDate: z.string().optional().nullable(),
  baptized: participantSchema,
  parents: z.object({
    father: participantSchema.optional(),
    mother: participantSchema.optional(),
  }).optional(),
  godparents: z.array(participantSchema).max(2).optional(),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  contactPhone: z.string().min(1, 'Contact phone is required').max(50),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().optional(),
});

// Funeral form schema
export const funeralFormSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  eventDate: z.string().optional().nullable(),
  location: z.string().max(255).optional(),
  deceased: participantSchema,
  familyMembers: z.array(participantSchema).optional(),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  contactPhone: z.string().min(1, 'Contact phone is required').max(50),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  notes: z.string().optional(),
  isUrgent: z.boolean().optional().default(false),
});

export type WeddingFormData = z.infer<typeof weddingFormSchema>;
export type BaptismFormData = z.infer<typeof baptismFormSchema>;
export type FuneralFormData = z.infer<typeof funeralFormSchema>;



