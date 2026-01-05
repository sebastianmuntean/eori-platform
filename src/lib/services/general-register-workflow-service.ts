import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

export type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
export type StepStatus = 'pending' | 'completed';
export type ResolutionStatus = 'approved' | 'rejected' | null;

/**
 * Calculate document status based on workflow steps
 * New rules:
 * - draft → if not saved final (only created, without save)
 * - resolved → if there's solution with approved or rejected
 * - in_work → if saved without solution and without distributions to users
 * - distributed → if saved with distributions to users (either through "Redirect" or through direct distributions)
 * - cancelled → if cancelled from grid (after registration)
 */
export async function calculateDocumentStatus(documentId: string): Promise<DocumentStatus> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new Error('Document not found');
  }

  // Check if document is cancelled
  const workflowSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId));

  const isCancelled = workflowSteps.some(step => step.action === 'cancelled');
  if (isCancelled) {
    return 'cancelled';
  }

  // If no workflow steps, document is still in draft (not saved yet)
  if (workflowSteps.length === 0) {
    return 'draft';
  }

  // Check if there's a solution (approved or rejected)
  const hasApproved = workflowSteps.some(step => step.resolutionStatus === 'approved');
  const hasRejected = workflowSteps.some(step => step.resolutionStatus === 'rejected');
  
  if (hasApproved || hasRejected) {
    return 'resolved';
  }

  // Check if there are pending steps (distributed to users)
  const hasPending = workflowSteps.some(step => step.stepStatus === 'pending' && step.toUserId !== null);
  if (hasPending) {
    return 'distributed';
  }

  // If there are workflow steps but no pending steps and no resolution, document is in work
  // This means the document was saved but not distributed and not resolved
  if (workflowSteps.length > 0) {
    return 'in_work';
  }

  // Default to draft (should not reach here, but fallback)
  return 'draft';
}

/**
 * Check if user can resolve a document
 */
export async function canUserResolveDocument(documentId: string, userId: string, hasResolveAnyPermission: boolean): Promise<boolean> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    return false;
  }

  // Check if user has resolve_any permission
  if (hasResolveAnyPermission) {
    return true;
  }

  // Check if user is creator
  if (document.createdBy === userId) {
    return true;
  }

  // Check if user has pending steps
  const pendingSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(
      and(
        eq(generalRegisterWorkflow.documentId, documentId),
        eq(generalRegisterWorkflow.toUserId, userId),
        eq(generalRegisterWorkflow.stepStatus, 'pending')
      )
    );

  return pendingSteps.length > 0;
}

/**
 * Check if user can cancel a document
 */
export async function canUserCancelDocument(documentId: string, userId: string): Promise<{ canCancel: boolean; canCancelAll: boolean }> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    return { canCancel: false, canCancelAll: false };
  }

  const isCreator = document.createdBy === userId;

  // Check if user has pending steps
  const pendingSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(
      and(
        eq(generalRegisterWorkflow.documentId, documentId),
        eq(generalRegisterWorkflow.toUserId, userId),
        eq(generalRegisterWorkflow.stepStatus, 'pending')
      )
    );

  const hasPendingSteps = pendingSteps.length > 0;

  return {
    canCancel: isCreator || hasPendingSteps,
    canCancelAll: isCreator,
  };
}

/**
 * Get workflow tree structure for a document
 */
export async function getWorkflowTree(documentId: string) {
  const workflowSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId));

  // Build tree structure
  const stepMap = new Map(workflowSteps.map(step => [step.id, { ...step, children: [] }]));
  const rootSteps: any[] = [];

  for (const step of workflowSteps) {
    const stepWithChildren = stepMap.get(step.id)!;
    if (step.parentStepId) {
      const parent = stepMap.get(step.parentStepId);
      if (parent) {
        parent.children.push(stepWithChildren);
      }
    } else {
      rootSteps.push(stepWithChildren);
    }
  }

  return {
    steps: workflowSteps,
    tree: rootSteps,
  };
}

/**
 * Update document status based on workflow
 */
export async function updateDocumentStatusFromWorkflow(documentId: string, userId: string): Promise<void> {
  const newStatus = await calculateDocumentStatus(documentId);
  
  await db
    .update(generalRegister)
    .set({
      status: newStatus,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(generalRegister.id, documentId));
}


