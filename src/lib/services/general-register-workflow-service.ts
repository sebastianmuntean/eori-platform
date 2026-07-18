import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow, users } from '@/database/schema';
import { NotFoundError, AuthorizationError, ValidationError } from '@/lib/errors';
import { eq, and, desc, inArray } from 'drizzle-orm';

export type DocumentStatus =
  | 'draft'
  | 'registered'
  | 'in_work'
  | 'distributed'
  | 'resolved'
  | 'archived'
  | 'cancelled';

/** Statuses produced by workflow calculation (subset of DB enum) */
export type CalculatedDocumentStatus =
  | 'draft'
  | 'in_work'
  | 'distributed'
  | 'resolved'
  | 'cancelled';
export type StepStatus = 'in_work' | 'redirected' | 'resolved';
export type ResolutionStatus = 'approved' | 'rejected' | null;

export interface ResolveDocumentInput {
  resolutionStatus: 'approved' | 'rejected';
  resolution?: string | null;
  notes?: string | null;
  workflowStepId?: string | null;
}

export interface CancelDocumentInput {
  cancelAll?: boolean;
  notes?: string | null;
}

export interface CreateWorkflowStepInput {
  parentStepId?: string | null;
  toUserId: string;
  action: 'sent' | 'forwarded' | 'returned';
  notes?: string | null;
}

/**
 * Calculate document status based on workflow steps
 * New rules:
 * - draft → if not saved final (only created, without save)
 * - resolved → if there's solution with approved or rejected
 * - in_work → if saved without solution and without distributions to users
 * - distributed → if saved with distributions to users (either through "Redirect" or through direct distributions)
 * - cancelled → if cancelled from grid (after registration)
 */
export async function calculateDocumentStatus(
  documentId: string
): Promise<CalculatedDocumentStatus> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const workflowSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId));

  const isCancelled = workflowSteps.some(step => step.action === 'cancelled');
  if (isCancelled) {
    return 'cancelled';
  }

  if (workflowSteps.length === 0) {
    return 'draft';
  }

  const hasApproved = workflowSteps.some(step => step.resolutionStatus === 'approved');
  const hasRejected = workflowSteps.some(step => step.resolutionStatus === 'rejected');

  if (hasApproved || hasRejected) {
    return 'resolved';
  }

  const hasInWork = workflowSteps.some(step => step.stepStatus === 'in_work' && step.toUserId !== null);
  if (hasInWork) {
    return 'distributed';
  }

  const hasRedirected = workflowSteps.some(step => step.stepStatus === 'redirected');
  if (hasRedirected) {
    const hasInWorkFromRedirect = workflowSteps.some(step => step.stepStatus === 'in_work' && step.toUserId !== null);
    if (hasInWorkFromRedirect) {
      return 'distributed';
    }
  }

  if (workflowSteps.length > 0) {
    return 'in_work';
  }

  return 'draft';
}

/**
 * Check if user can resolve a document
 */
export async function canUserResolveDocument(
  documentId: string,
  userId: string,
  hasResolveAnyPermission: boolean
): Promise<boolean> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    return false;
  }

  if (hasResolveAnyPermission) {
    return true;
  }

  if (document.createdBy === userId) {
    return true;
  }

  const inWorkSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(
      and(
        eq(generalRegisterWorkflow.documentId, documentId),
        eq(generalRegisterWorkflow.toUserId, userId),
        eq(generalRegisterWorkflow.stepStatus, 'in_work')
      )
    );

  return inWorkSteps.length > 0;
}

/**
 * Check if user can cancel a document
 */
export async function canUserCancelDocument(
  documentId: string,
  userId: string
): Promise<{ canCancel: boolean; canCancelAll: boolean }> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    return { canCancel: false, canCancelAll: false };
  }

  const isCreator = document.createdBy === userId;

  const inWorkSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(
      and(
        eq(generalRegisterWorkflow.documentId, documentId),
        eq(generalRegisterWorkflow.toUserId, userId),
        eq(generalRegisterWorkflow.stepStatus, 'in_work')
      )
    );

  const hasInWorkSteps = inWorkSteps.length > 0;

  return {
    canCancel: isCreator || hasInWorkSteps,
    canCancelAll: isCreator,
  };
}

type WorkflowStepRow = typeof generalRegisterWorkflow.$inferSelect;

export type EnrichedWorkflowStep = WorkflowStepRow & {
  fromUserName?: string;
  fromUserEmail?: string;
  toUserName?: string;
  toUserEmail?: string;
  children: EnrichedWorkflowStep[];
};

/**
 * Get workflow tree structure for a document, enriched with user names
 */
export async function getWorkflowTree(documentId: string): Promise<{
  steps: EnrichedWorkflowStep[];
  tree: EnrichedWorkflowStep[];
}> {
  const [document] = await db
    .select({ id: generalRegister.id })
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const workflowSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId))
    .orderBy(desc(generalRegisterWorkflow.createdAt));

  const userIds = new Set<string>();
  for (const step of workflowSteps) {
    if (step.fromUserId) userIds.add(step.fromUserId);
    if (step.toUserId) userIds.add(step.toUserId);
  }

  const userList =
    userIds.size > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, Array.from(userIds)))
      : [];
  const userMap = new Map(userList.map(u => [u.id, u]));

  const enrichedSteps: EnrichedWorkflowStep[] = workflowSteps.map(step => {
    const fromUser = step.fromUserId ? userMap.get(step.fromUserId) : undefined;
    const toUser = step.toUserId ? userMap.get(step.toUserId) : undefined;
    return {
      ...step,
      fromUserName: fromUser?.name ?? undefined,
      fromUserEmail: fromUser?.email ?? undefined,
      toUserName: toUser?.name ?? undefined,
      toUserEmail: toUser?.email ?? undefined,
      children: [],
    };
  });

  const stepMap = new Map<string, EnrichedWorkflowStep>(
    enrichedSteps.map(s => [s.id, s])
  );
  const rootSteps: EnrichedWorkflowStep[] = [];

  for (const step of enrichedSteps) {
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
    steps: enrichedSteps,
    tree: rootSteps,
  };
}

/**
 * Update document status based on workflow
 */
export async function updateDocumentStatusFromWorkflow(
  documentId: string,
  userId: string
): Promise<void> {
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

/**
 * Resolve a document (approve/reject) and update workflow steps
 */
export async function resolveGeneralRegisterDocument(
  documentId: string,
  userId: string,
  data: ResolveDocumentInput,
  hasResolveAnyPermission: boolean
): Promise<{ documentId: string; resolutionStatus: string; stepsUpdated: number }> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const isCreator = document.createdBy === userId;

  let stepsToUpdate: WorkflowStepRow[] = [];
  if (data.workflowStepId) {
    const [step] = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.id, data.workflowStepId),
          eq(generalRegisterWorkflow.documentId, documentId),
          eq(generalRegisterWorkflow.toUserId, userId),
          eq(generalRegisterWorkflow.stepStatus, 'in_work')
        )
      )
      .limit(1);
    if (step) {
      stepsToUpdate = [step];
    }
  } else {
    stepsToUpdate = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.documentId, documentId),
          eq(generalRegisterWorkflow.toUserId, userId),
          eq(generalRegisterWorkflow.stepStatus, 'in_work')
        )
      );
  }

  const hasInWorkStep = stepsToUpdate.length > 0;

  if (!hasResolveAnyPermission && !isCreator && !hasInWorkStep) {
    throw new AuthorizationError('Insufficient permissions to resolve this document');
  }

  if (stepsToUpdate.length === 0 && !hasResolveAnyPermission && !isCreator) {
    throw new ValidationError('No in_work steps found for this user');
  }

  if (stepsToUpdate.length === 0 && (hasResolveAnyPermission || isCreator)) {
    const [newStep] = await db
      .insert(generalRegisterWorkflow)
      .values({
        documentId,
        parentStepId: null,
        fromUserId: userId,
        toUserId: userId,
        action: (data.resolutionStatus === 'approved' ? 'approved' : 'rejected') as
          | 'approved'
          | 'rejected',
        stepStatus: 'resolved' as const,
        resolutionStatus: data.resolutionStatus,
        resolution: data.resolution || null,
        notes: data.notes || null,
        isExpired: false,
        completedAt: new Date(),
      })
      .returning();

    stepsToUpdate.push(newStep);
  } else {
    for (const step of stepsToUpdate) {
      await db
        .update(generalRegisterWorkflow)
        .set({
          stepStatus: 'resolved' as const,
          resolutionStatus: data.resolutionStatus,
          resolution: data.resolution || null,
          notes: data.notes || null,
          completedAt: new Date(),
        })
        .where(eq(generalRegisterWorkflow.id, step.id));
    }
  }

  const allSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, documentId));

  const hasResolved = allSteps.some(step => step.stepStatus === 'resolved');

  let newStatus: DocumentStatus = document.status as DocumentStatus;
  if (hasResolved) {
    newStatus = 'resolved';
  } else if (document.status !== 'in_work' && document.status !== 'distributed') {
    newStatus = 'in_work';
  }

  await db
    .update(generalRegister)
    .set({
      status: newStatus,
      resolutionStatus: data.resolutionStatus,
      resolution: data.resolution || null,
      updatedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(generalRegister.id, documentId));

  return {
    documentId,
    resolutionStatus: data.resolutionStatus,
    stepsUpdated: stepsToUpdate.length,
  };
}

/**
 * Cancel a document or the current user's workflow branch
 */
export async function cancelGeneralRegisterDocument(
  documentId: string,
  userId: string,
  data: CancelDocumentInput
): Promise<{ documentId: string; cancelledAll: boolean }> {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const isCreator = document.createdBy === userId;
  const cancelAll = data.cancelAll ?? false;

  if (cancelAll && !isCreator) {
    throw new AuthorizationError('Only document creator can cancel all branches');
  }

  if (cancelAll) {
    await db
      .update(generalRegisterWorkflow)
      .set({
        stepStatus: 'resolved',
        action: 'cancelled',
        notes: data.notes || null,
        completedAt: new Date(),
      })
      .where(eq(generalRegisterWorkflow.documentId, documentId));

    await db
      .update(generalRegister)
      .set({
        status: 'cancelled',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(generalRegister.id, documentId));
  } else {
    const userInWorkSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.documentId, documentId),
          eq(generalRegisterWorkflow.toUserId, userId),
          eq(generalRegisterWorkflow.stepStatus, 'in_work')
        )
      );

    if (userInWorkSteps.length === 0) {
      throw new ValidationError('No in_work steps found for this user');
    }

    for (const step of userInWorkSteps) {
      await db
        .update(generalRegisterWorkflow)
        .set({
          stepStatus: 'resolved',
          action: 'cancelled',
          notes: data.notes || null,
          completedAt: new Date(),
        })
        .where(eq(generalRegisterWorkflow.id, step.id));
    }

    const allSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(eq(generalRegisterWorkflow.documentId, documentId));

    const allResolved = allSteps.every(
      step => step.stepStatus === 'resolved' || step.action === 'cancelled'
    );

    if (allResolved) {
      await db
        .update(generalRegister)
        .set({
          status: 'cancelled',
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(generalRegister.id, documentId));
    }
  }

  return {
    documentId,
    cancelledAll: cancelAll,
  };
}

/**
 * Create a workflow step (forward/return) and recalculate document status
 */
export async function createWorkflowStep(
  documentId: string,
  userId: string,
  data: CreateWorkflowStepInput
) {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, documentId))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found');
  }

  const [toUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, data.toUserId))
    .limit(1);

  if (!toUser) {
    throw new ValidationError('User not found');
  }

  if (data.parentStepId) {
    const [parentStep] = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.id, data.parentStepId),
          eq(generalRegisterWorkflow.documentId, documentId)
        )
      )
      .limit(1);

    if (!parentStep) {
      throw new ValidationError('Parent step not found');
    }
  }

  const [workflowStep] = await db
    .insert(generalRegisterWorkflow)
    .values({
      documentId,
      parentStepId: data.parentStepId || null,
      fromUserId: userId,
      toUserId: data.toUserId,
      action: data.action,
      stepStatus: 'in_work',
      notes: data.notes || null,
      isExpired: false,
    })
    .returning();

  await updateDocumentStatusFromWorkflow(documentId, userId);

  return workflowStep;
}
