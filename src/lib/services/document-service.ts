import { db } from '@/database/client';
import {
  documentRegistry,
  documentNumberCounters,
  documentWorkflow,
  documentAttachments,
} from '@/database/schema';
import { eq, and, isNull, sql, desc, like, or, gte, lte } from 'drizzle-orm';

export type DocumentType = 'incoming' | 'outgoing' | 'internal';
export type DocumentStatus = 'draft' | 'registered' | 'in_work' | 'resolved' | 'archived';
export type DocumentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface GenerateDocumentNumberParams {
  parishId: string;
  documentType: DocumentType;
  year: number;
}

export interface GenerateDocumentNumberResult {
  registrationNumber: number;
  formattedNumber: string;
}

export interface RegisterDocumentParams {
  parishId: string;
  documentType: DocumentType;
  registrationDate?: Date;
  externalNumber?: string | null;
  externalDate?: Date | null;
  senderPartnerId?: string | null;
  senderName?: string | null;
  senderDocNumber?: string | null;
  senderDocDate?: Date | null;
  recipientPartnerId?: string | null;
  recipientName?: string | null;
  subject: string;
  content?: string | null;
  priority?: DocumentPriority;
  status?: DocumentStatus;
  departmentId?: string | null;
  assignedTo?: string | null;
  dueDate?: Date | null;
  fileIndex?: string | null;
  parentDocumentId?: string | null;
  isSecret?: boolean;
  secretDeclassificationList?: string[] | null;
  createdBy: string;
}

export interface RouteDocumentParams {
  documentId: string;
  fromUserId: string;
  toUserId?: string | null;
  toDepartmentId?: string | null;
  action: 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected';
  resolution?: string | null;
  notes?: string | null;
}

export interface ResolveDocumentParams {
  documentId: string;
  userId: string;
  resolution?: string | null;
  notes?: string | null;
}

export interface SearchDocumentsParams {
  parishId?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  priority?: DocumentPriority;
  year?: number;
  startDate?: Date;
  endDate?: Date;
  subject?: string;
  content?: string;
  senderName?: string;
  recipientName?: string;
  departmentId?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
}

/**
 * Generate a unique document registration number
 */
export async function generateDocumentNumber(
  params: GenerateDocumentNumberParams
): Promise<GenerateDocumentNumberResult> {
  const { parishId, documentType, year } = params;

  // Try to get or create counter
  const [counter] = await db
    .select()
    .from(documentNumberCounters)
    .where(
      and(
        eq(documentNumberCounters.parishId, parishId),
        eq(documentNumberCounters.year, year),
        eq(documentNumberCounters.documentType, documentType)
      )
    )
    .limit(1);

  let nextNumber: number;

  if (counter) {
    // Increment existing counter
    nextNumber = counter.currentValue + 1;
    await db
      .update(documentNumberCounters)
      .set({
        currentValue: nextNumber,
        updatedAt: new Date(),
      })
      .where(eq(documentNumberCounters.id, counter.id));
  } else {
    // Create new counter starting at 1
    nextNumber = 1;
    await db.insert(documentNumberCounters).values({
      parishId,
      year,
      documentType,
      currentValue: nextNumber,
    });
  }

  const formattedNumber = `${nextNumber}/${year}`;

  return {
    registrationNumber: nextNumber,
    formattedNumber,
  };
}

/**
 * Register a new document
 */
export async function registerDocument(
  params: RegisterDocumentParams
): Promise<typeof documentRegistry.$inferSelect> {
  const {
    parishId,
    documentType,
    registrationDate,
    subject,
    content,
    priority = 'normal',
    status = 'draft',
    createdBy,
    ...rest
  } = params;

  // Generate registration number if status is 'registered' or registrationDate is provided
  let registrationNumber: number | null = null;
  let registrationYear: number | null = null;
  let formattedNumber: string | null = null;

  if (status === 'registered' || registrationDate) {
    const regDate = registrationDate || new Date();
    registrationYear = regDate.getFullYear();

    const numberData = await generateDocumentNumber({
      parishId,
      documentType,
      year: registrationYear,
    });
    registrationNumber = numberData.registrationNumber;
    formattedNumber = numberData.formattedNumber;
  }

  const [newDocument] = await db
    .insert(documentRegistry)
    .values({
      parishId,
      documentType,
      registrationNumber,
      registrationYear,
      formattedNumber,
      registrationDate: registrationDate || null,
      externalNumber: rest.externalNumber || null,
      externalDate: rest.externalDate || null,
      senderPartnerId: rest.senderPartnerId || null,
      senderName: rest.senderName || null,
      senderDocNumber: rest.senderDocNumber || null,
      senderDocDate: rest.senderDocDate || null,
      recipientPartnerId: rest.recipientPartnerId || null,
      recipientName: rest.recipientName || null,
      subject,
      content: content || null,
      priority,
      status,
      departmentId: rest.departmentId || null,
      assignedTo: rest.assignedTo || null,
      dueDate: rest.dueDate || null,
      fileIndex: rest.fileIndex || null,
      parentDocumentId: rest.parentDocumentId || null,
      isSecret: rest.isSecret || false,
      secretDeclassificationList: rest.secretDeclassificationList || null,
      createdBy,
      updatedBy: createdBy,
    })
    .returning();

  return newDocument;
}

/**
 * Route a document to another user or department
 */
export async function routeDocument(
  params: RouteDocumentParams
): Promise<{
  document: typeof documentRegistry.$inferSelect;
  workflow: typeof documentWorkflow.$inferSelect;
}> {
  const { documentId, fromUserId, toUserId, toDepartmentId, action, resolution, notes } = params;

  // Check if document exists
  const [document] = await db
    .select()
    .from(documentRegistry)
    .where(and(eq(documentRegistry.id, documentId), isNull(documentRegistry.deletedAt)))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Validate that at least one destination is provided
  if (!toUserId && !toDepartmentId) {
    throw new Error('Either toUserId or toDepartmentId must be provided');
  }

  // Create workflow record
  const [workflowRecord] = await db
    .insert(documentWorkflow)
    .values({
      documentId,
      fromUserId,
      toUserId: toUserId || null,
      toDepartmentId: toDepartmentId || null,
      action,
      resolution: resolution || null,
      notes: notes || null,
      isExpired: false,
    })
    .returning();

  // Update document status based on action
  let newStatus = document.status;
  if (action === 'sent' || action === 'received') {
    newStatus = 'in_work';
  } else if (action === 'resolved') {
    newStatus = 'resolved';
  }

  // Update document
  const [updatedDocument] = await db
    .update(documentRegistry)
    .set({
      status: newStatus,
      assignedTo: toUserId || document.assignedTo,
      departmentId: toDepartmentId || document.departmentId,
      updatedBy: fromUserId,
      updatedAt: new Date(),
      ...(action === 'resolved' && !document.resolvedDate
        ? { resolvedDate: new Date() }
        : {}),
    })
    .where(eq(documentRegistry.id, documentId))
    .returning();

  if (!updatedDocument) {
    throw new Error('Failed to update document');
  }

  return {
    document: updatedDocument,
    workflow: workflowRecord,
  };
}

/**
 * Resolve a document
 */
export async function resolveDocument(
  params: ResolveDocumentParams
): Promise<{
  document: typeof documentRegistry.$inferSelect;
  workflow: typeof documentWorkflow.$inferSelect;
}> {
  const { documentId, userId, resolution, notes } = params;

  // Check if document exists
  const [document] = await db
    .select()
    .from(documentRegistry)
    .where(and(eq(documentRegistry.id, documentId), isNull(documentRegistry.deletedAt)))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Create workflow record for resolution
  const [workflowRecord] = await db
    .insert(documentWorkflow)
    .values({
      documentId,
      fromUserId: userId,
      action: 'resolved',
      resolution: resolution || null,
      notes: notes || null,
      isExpired: false,
    })
    .returning();

  // Update document status
  const [updatedDocument] = await db
    .update(documentRegistry)
    .set({
      status: 'resolved',
      resolvedDate: new Date(),
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(documentRegistry.id, documentId))
    .returning();

  if (!updatedDocument) {
    throw new Error('Failed to update document');
  }

  return {
    document: updatedDocument,
    workflow: workflowRecord,
  };
}

/**
 * Archive a document
 */
export async function archiveDocument(
  documentId: string,
  userId: string,
  archiveIndicator: string,
  archiveTerm: string,
  archiveLocation?: string | null
): Promise<typeof documentRegistry.$inferSelect> {
  // Check if document exists
  const [document] = await db
    .select()
    .from(documentRegistry)
    .where(and(eq(documentRegistry.id, documentId), isNull(documentRegistry.deletedAt)))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Update document
  const [updatedDocument] = await db
    .update(documentRegistry)
    .set({
      status: 'archived',
      fileIndex: archiveIndicator,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(documentRegistry.id, documentId))
    .returning();

  if (!updatedDocument) {
    throw new Error('Failed to archive document');
  }

  return updatedDocument;
}

/**
 * Search documents with advanced filtering
 */
export async function searchDocuments(
  params: SearchDocumentsParams
): Promise<{
  documents: (typeof documentRegistry.$inferSelect)[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 10,
    parishId,
    documentType,
    status,
    priority,
    year,
    startDate,
    endDate,
    subject,
    content,
    senderName,
    recipientName,
    departmentId,
    assignedTo,
  } = params;

  // Build query conditions (AND logic)
  const conditions = [isNull(documentRegistry.deletedAt)]; // Only non-deleted documents

  if (parishId) {
    conditions.push(eq(documentRegistry.parishId, parishId));
  }

  if (documentType) {
    conditions.push(eq(documentRegistry.documentType, documentType));
  }

  if (status) {
    conditions.push(eq(documentRegistry.status, status));
  }

  if (priority) {
    conditions.push(eq(documentRegistry.priority, priority));
  }

  if (year) {
    conditions.push(eq(documentRegistry.registrationYear, year));
  }

  if (startDate) {
    conditions.push(gte(documentRegistry.registrationDate, startDate));
  }

  if (endDate) {
    conditions.push(lte(documentRegistry.registrationDate, endDate));
  }

  if (subject) {
    conditions.push(like(documentRegistry.subject, `%${subject}%`));
  }

  if (content) {
    conditions.push(like(documentRegistry.content || '', `%${content}%`));
  }

  if (senderName) {
    conditions.push(like(documentRegistry.senderName || '', `%${senderName}%`));
  }

  if (recipientName) {
    conditions.push(like(documentRegistry.recipientName || '', `%${recipientName}%`));
  }

  if (departmentId) {
    conditions.push(eq(documentRegistry.departmentId, departmentId));
  }

  if (assignedTo) {
    conditions.push(eq(documentRegistry.assignedTo, assignedTo));
  }

  const whereClause = conditions.length > 1 ? and(...(conditions as any[])) : conditions[0];

  // Get total count
  const totalCountResult = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(documentRegistry)
    .where(whereClause);
  const totalCount = Number(totalCountResult[0]?.count || 0);

  // Get paginated results
  const offset = (page - 1) * limit;
  const documents = await db
    .select()
    .from(documentRegistry)
    .where(whereClause)
    .orderBy(desc(documentRegistry.registrationDate))
    .limit(limit)
    .offset(offset);

  return {
    documents,
    total: totalCount,
    page,
    pageSize: limit,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * Get document history (workflow history)
 */
export async function getDocumentHistory(
  documentId: string
): Promise<(typeof documentWorkflow.$inferSelect)[]> {
  // Check if document exists
  const [document] = await db
    .select()
    .from(documentRegistry)
    .where(and(eq(documentRegistry.id, documentId), isNull(documentRegistry.deletedAt)))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Get workflow history
  const workflowHistory = await db
    .select()
    .from(documentWorkflow)
    .where(eq(documentWorkflow.documentId, documentId))
    .orderBy(desc(documentWorkflow.createdAt));

  return workflowHistory;
}


