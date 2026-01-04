import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

export type DocumentStatus = 'draft' | 'registered' | 'in_work' | 'distributed' | 'resolved' | 'archived' | 'cancelled';
export type StepStatus = 'pending' | 'completed';
export type ResolutionStatus = 'approved' | 'rejected' | null;

/**
 * Calculate document status based on workflow steps
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

  // Get all workflow steps
  const workflowSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId));

  if (workflowSteps.length === 0) {
    // No workflow steps, return current status
    return document.status as DocumentStatus;
  }

  // Check if all steps are completed
  const allCompleted = workflowSteps.every(step => step.stepStatus === 'completed');
  const hasPending = workflowSteps.some(step => step.stepStatus === 'pending');
  const hasApproved = workflowSteps.some(step => step.resolutionStatus === 'approved');
  const hasRejected = workflowSteps.some(step => step.resolutionStatus === 'rejected');
  const allRejected = workflowSteps.filter(step => step.stepStatus === 'completed').every(step => step.resolutionStatus === 'rejected');

  // Check if document is cancelled
  const isCancelled = workflowSteps.some(step => step.action === 'cancelled');
  if (isCancelled && allCompleted) {
    return 'cancelled';
  }

  // If all steps are completed
  if (allCompleted) {
    if (hasApproved) {
      return 'resolved';
    }
    if (allRejected) {
      // All branches rejected, but document can continue workflow
      return 'resolved';
    }
    return 'resolved';
  }

  // If there are pending steps
  if (hasPending) {
    // Check if all pending steps are without resolutions (distributed)
    const pendingSteps = workflowSteps.filter(step => step.stepStatus === 'pending');
    const allPendingWithoutResolution = pendingSteps.every(step => !step.resolutionStatus);
    
    if (allPendingWithoutResolution && !hasRejected) {
      return 'distributed';
    }
    
    // Otherwise, document is in work
    return 'in_work';
  }

  // Default to current status
  return document.status as DocumentStatus;
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


