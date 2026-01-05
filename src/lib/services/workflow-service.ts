import { db } from '@/database/client';
import { documentRegistry, documentWorkflow, users, departments } from '@/database/schema';
import { eq, and, isNull, desc, or, sql } from 'drizzle-orm';
import { routeDocument, resolveDocument } from './document-service';

export type WorkflowAction = 'sent' | 'received' | 'resolved' | 'returned' | 'approved' | 'rejected';

export interface SendDocumentParams {
  documentId: string;
  fromUserId: string;
  toUserId?: string | null;
  toDepartmentId?: string | null;
  notes?: string | null;
}

export interface ReceiveDocumentParams {
  documentId: string;
  userId: string;
  notes?: string | null;
}

export interface GetUserPendingDocumentsParams {
  userId: string;
  departmentId?: string | null;
  page?: number;
  limit?: number;
}

/**
 * Send a document to another user or department
 */
export async function sendDocument(
  params: SendDocumentParams
): Promise<{
  document: typeof documentRegistry.$inferSelect;
  workflow: typeof documentWorkflow.$inferSelect;
}> {
  const { documentId, fromUserId, toUserId, toDepartmentId, notes } = params;

  // Validate that at least one destination is provided
  if (!toUserId && !toDepartmentId) {
    throw new Error('Either toUserId or toDepartmentId must be provided');
  }

  // Validate user/department exists if provided
  if (toUserId) {
    const [user] = await db.select().from(users).where(eq(users.id, toUserId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }
  }

  if (toDepartmentId) {
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, toDepartmentId))
      .limit(1);
    if (!dept) {
      throw new Error('Department not found');
    }
  }

  return routeDocument({
    documentId,
    fromUserId,
    toUserId,
    toDepartmentId,
    action: 'sent',
    notes,
  });
}

/**
 * Receive a document (mark as received)
 */
export async function receiveDocument(
  params: ReceiveDocumentParams
): Promise<{
  document: typeof documentRegistry.$inferSelect;
  workflow: typeof documentWorkflow.$inferSelect;
}> {
  const { documentId, userId, notes } = params;

  // Check if document exists
  const [document] = await db
    .select()
    .from(documentRegistry)
    .where(and(eq(documentRegistry.id, documentId), isNull(documentRegistry.deletedAt)))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Get the sender from the last workflow entry
  const [lastWorkflow] = await db
    .select()
    .from(documentWorkflow)
    .where(eq(documentWorkflow.documentId, documentId))
    .orderBy(desc(documentWorkflow.createdAt))
    .limit(1);

  return routeDocument({
    documentId,
    fromUserId: userId,
    toUserId: lastWorkflow?.fromUserId || null,
    toDepartmentId: lastWorkflow?.fromDepartmentId || null,
    action: 'received',
    notes,
  });
}

/**
 * Check for expired documents (documents with due date in the past)
 */
export async function checkExpiredDocuments(
  parishId?: string,
  departmentId?: string
): Promise<(typeof documentRegistry.$inferSelect)[]> {
  const conditions: any[] = [
    isNull(documentRegistry.deletedAt),
    eq(documentRegistry.status, 'in_work'),
    // dueDate is in the past
    // Note: This is a simplified check. In a real implementation, you'd use a proper date comparison
  ];

  if (parishId) {
    conditions.push(eq(documentRegistry.parishId, parishId));
  }

  if (departmentId) {
    conditions.push(eq(documentRegistry.departmentId, departmentId));
  }

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Get documents with due date in the past
  const expiredDocuments = await db
    .select()
    .from(documentRegistry)
    .where(whereClause);

  // Filter in memory for due date check (Drizzle doesn't have easy date comparison)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return expiredDocuments.filter((doc) => {
    if (!doc.dueDate) return false;
    const dueDate = new Date(doc.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
}

/**
 * Get pending documents for a user
 */
export async function getUserPendingDocuments(
  params: GetUserPendingDocumentsParams
): Promise<{
  documents: (typeof documentRegistry.$inferSelect)[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const { userId, departmentId, page = 1, limit = 10 } = params;

  // Build conditions for pending documents
  const conditions: any[] = [
    isNull(documentRegistry.deletedAt),
    or(
      eq(documentRegistry.assignedTo, userId),
      departmentId ? eq(documentRegistry.departmentId, departmentId) : undefined
    )!,
    or(
      eq(documentRegistry.status, 'in_work'),
      eq(documentRegistry.status, 'registered')
    )!,
  ].filter(Boolean);

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

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
    .orderBy(desc(documentRegistry.createdAt))
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
 * Get workflow history for a document
 */
export async function getDocumentWorkflowHistory(
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

