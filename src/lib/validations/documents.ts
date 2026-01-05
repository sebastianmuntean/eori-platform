import { z } from 'zod';

export const createDocumentSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  registrationDate: z.string().optional(),
  externalNumber: z.string().max(100).optional().nullable(),
  externalDate: z.string().optional().nullable(),
  senderPartnerId: z.string().uuid().optional().nullable(),
  senderName: z.string().max(255).optional().nullable(),
  senderDocNumber: z.string().max(100).optional().nullable(),
  senderDocDate: z.string().optional().nullable(),
  recipientPartnerId: z.string().uuid().optional().nullable(),
  recipientName: z.string().max(255).optional().nullable(),
  subject: z.string().min(1, 'Subject is required').max(500),
  content: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional().default('draft'),
  departmentId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  fileIndex: z.string().max(50).optional().nullable(),
  parentDocumentId: z.string().uuid().optional().nullable(),
  isSecret: z.boolean().optional().default(false),
  secretDeclassificationList: z.array(z.string()).optional().nullable(),
});

export const updateDocumentSchema = z.object({
  documentType: z.enum(['incoming', 'outgoing', 'internal']).optional(),
  registrationDate: z.string().optional().nullable(),
  externalNumber: z.string().max(100).optional().nullable(),
  externalDate: z.string().optional().nullable(),
  senderPartnerId: z.string().uuid().optional().nullable(),
  senderName: z.string().max(255).optional().nullable(),
  senderDocNumber: z.string().max(100).optional().nullable(),
  senderDocDate: z.string().optional().nullable(),
  recipientPartnerId: z.string().uuid().optional().nullable(),
  recipientName: z.string().max(255).optional().nullable(),
  subject: z.string().min(1).max(500).optional(),
  content: z.string().optional().nullable(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  fileIndex: z.string().max(50).optional().nullable(),
  parentDocumentId: z.string().uuid().optional().nullable(),
  isSecret: z.boolean().optional(),
  secretDeclassificationList: z.array(z.string()).optional().nullable(),
});

export const routeDocumentSchema = z.object({
  toUserId: z.string().uuid().optional().nullable(),
  toDepartmentId: z.string().uuid().optional().nullable(),
  action: z.enum(['sent', 'received', 'resolved', 'returned', 'approved', 'rejected']),
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const resolveDocumentSchema = z.object({
  resolution: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const archiveDocumentSchema = z.object({
  archiveIndicator: z.string().max(50).optional().nullable(),
  archiveTerm: z.string().max(50).optional().nullable(),
  archiveLocation: z.string().max(255).optional().nullable(),
});

export const searchDocumentsSchema = z.object({
  parishId: z.string().uuid().optional(),
  documentType: z.enum(['incoming', 'outgoing', 'internal']).optional(),
  status: z.enum(['draft', 'registered', 'in_work', 'resolved', 'archived']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  year: z.number().int().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  senderName: z.string().optional(),
  recipientName: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(10),
});
