import { z } from 'zod';

// Mapping type enum
export const mappingTypeEnum = z.enum(['direct', 'sql', 'transformation']);

// Single mapping schema
export const mappingSchema = z.object({
  fieldKey: z.string().min(1),
  targetTable: z.string().min(1),
  targetColumn: z.string().min(1),
  mappingType: mappingTypeEnum,
  sqlQuery: z.string().optional(),
  transformation: z.record(z.any()).optional().nullable(),
});

// Dataset schema
export const createDatasetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  targetModule: z.enum(['registratura', 'general_register', 'events', 'clients']),
  parishId: z.string().uuid().optional().nullable(),
  isDefault: z.boolean().default(false),
  mappings: z.array(mappingSchema).default([]),
});

export const updateDatasetSchema = createDatasetSchema.partial();

export type MappingDataset = z.infer<typeof createDatasetSchema> & {
  id: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string | null;
};




