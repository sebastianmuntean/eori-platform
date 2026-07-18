import { db } from '@/database/client';
import {
  generalRegister,
  generalRegisterWorkflow,
  registerConfigurations,
  users,
  notifications,
} from '@/database/schema';
import { generateRegistrationNumber } from '@/lib/services/register-number-service';
import { NotFoundError, AuthorizationError, ValidationError, logError } from '@/lib/errors';
import { eq, and, desc, like, or, sql, inArray } from 'drizzle-orm';

export type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
export type DocumentType = 'incoming' | 'outgoing' | 'internal';
export type SolutionStatus = 'approved' | 'rejected' | 'redirected' | null;

const MAX_NOTIFICATION_BATCH_SIZE = 100;
const MAX_SUBJECT_LENGTH_IN_MESSAGE = 200;
const NOTIFICATION_MODULE = 'registratura' as const;
const NOTIFICATION_TYPE = 'info' as const;

const NOTIFICATION_TITLES = {
  documentRedirected: 'Document redirectat către tine',
} as const;

const NOTIFICATION_MESSAGES = {
  documentRedirected: (subject: string) =>
    `Un document a fost redirectat către tine pentru rezolvare: "${subject}"`,
} as const;

export interface ListGeneralRegisterFilters {
  registerConfigurationId: string;
  year?: number;
  documentType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface CreateGeneralRegisterDocumentInput {
  registerConfigurationId: string;
  documentType: DocumentType;
  subject: string;
  from?: string | null;
  petitionerClientId?: string | null;
  to?: string | null;
  description?: string | null;
  filePath?: string | null;
  status?: DocumentStatus;
}

export interface UpdateGeneralRegisterDocumentInput {
  subject?: string;
  description?: string | null;
  solutionStatus?: SolutionStatus;
  distributedUserIds?: string[];
  dueDate?: string | null;
  notes?: string | null;
}

/**
 * List general register documents with filters and pagination
 */
export async function listGeneralRegisterDocuments(
  filters: ListGeneralRegisterFilters,
  pagination: PaginationParams
) {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  const conditions = [
    eq(generalRegister.registerConfigurationId, filters.registerConfigurationId),
  ];

  if (filters.year !== undefined) {
    conditions.push(eq(generalRegister.year, filters.year));
  }
  if (filters.documentType) {
    conditions.push(eq(generalRegister.documentType, filters.documentType));
  }
  if (filters.status) {
    conditions.push(eq(generalRegister.status, filters.status));
  }
  if (filters.search) {
    conditions.push(
      or(
        like(generalRegister.subject, `%${filters.search}%`),
        like(generalRegister.from || '', `%${filters.search}%`),
        like(generalRegister.to || '', `%${filters.search}%`)
      )!
    );
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(generalRegister)
    .where(whereClause);

  const total = Number(countResult?.count || 0);

  const documents = await db
    .select({
      id: generalRegister.id,
      registerConfigurationId: generalRegister.registerConfigurationId,
      parishId: generalRegister.parishId,
      documentNumber: generalRegister.documentNumber,
      year: generalRegister.year,
      documentType: generalRegister.documentType,
      date: generalRegister.date,
      subject: generalRegister.subject,
      from: generalRegister.from,
      to: generalRegister.to,
      description: generalRegister.description,
      filePath: generalRegister.filePath,
      status: generalRegister.status,
      createdBy: generalRegister.createdBy,
      createdAt: generalRegister.createdAt,
      updatedAt: generalRegister.updatedAt,
      updatedBy: generalRegister.updatedBy,
    })
    .from(generalRegister)
    .where(whereClause)
    .orderBy(desc(generalRegister.createdAt))
    .limit(pageSize)
    .offset(offset);

  return {
    documents,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Create a new general register document
 */
export async function createGeneralRegisterDocument(
  data: CreateGeneralRegisterDocumentInput,
  userId: string
) {
  const [registerConfig] = await db
    .select()
    .from(registerConfigurations)
    .where(eq(registerConfigurations.id, data.registerConfigurationId))
    .limit(1);

  if (!registerConfig) {
    throw new ValidationError('Register configuration not found');
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const numberData = await generateRegistrationNumber({
    registerConfigId: data.registerConfigurationId,
    year: currentYear,
  });

  const [newDocument] = await db
    .insert(generalRegister)
    .values({
      registerConfigurationId: data.registerConfigurationId,
      parishId: registerConfig.parishId,
      documentNumber: numberData.documentNumber,
      year: numberData.year,
      documentType: data.documentType,
      date: currentDate.toISOString().split('T')[0],
      subject: data.subject,
      from: data.from || null,
      petitionerClientId: data.petitionerClientId || null,
      to: data.to || null,
      description: data.description || null,
      filePath: data.filePath || null,
      status: data.status || 'draft',
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();

  return newDocument;
}

/**
 * Get a general register document by ID
 */
export async function getGeneralRegisterDocument(id: string) {
  const [document] = await db
    .select()
    .from(generalRegister)
    .where(eq(generalRegister.id, id))
    .limit(1);

  if (!document) {
    throw new NotFoundError('Document not found or access denied');
  }

  return document;
}

function calculateStatusFromSolution(
  solutionStatus: SolutionStatus,
  distributedUserIds: string[]
): DocumentStatus {
  if (solutionStatus === 'approved' || solutionStatus === 'rejected') {
    return 'resolved';
  }

  if (solutionStatus === 'redirected' && distributedUserIds.length > 0) {
    return 'distributed';
  }

  if (!solutionStatus) {
    return distributedUserIds.length > 0 ? 'distributed' : 'in_work';
  }

  return 'in_work';
}

async function validateUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const validUsers = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(and(inArray(users.id, userIds), eq(users.isActive, true)));

  return validUsers.map(user => user.id);
}

async function createCreatorWorkflowStep(
  documentId: string,
  createdBy: string,
  solutionStatus: SolutionStatus,
  notes: string | null
): Promise<string | null> {
  const isResolved = solutionStatus === 'approved' || solutionStatus === 'rejected';

  const [created] = await db
    .insert(generalRegisterWorkflow)
    .values({
      documentId,
      parentStepId: null,
      fromUserId: createdBy,
      toUserId: createdBy,
      action: 'sent',
      stepStatus: isResolved ? 'resolved' : 'in_work',
      resolutionStatus:
        solutionStatus === 'approved'
          ? 'approved'
          : solutionStatus === 'rejected'
            ? 'rejected'
            : null,
      notes,
      isExpired: false,
      completedAt: isResolved ? new Date() : null,
    })
    .returning({ id: generalRegisterWorkflow.id });

  return created?.id ?? null;
}

async function createDistributionWorkflowSteps(
  documentId: string,
  createdBy: string,
  toUserIds: string[],
  notes: string | null,
  parentStepId: string | null = null
): Promise<void> {
  if (toUserIds.length === 0) {
    return;
  }

  const workflowSteps = toUserIds.map(toUserId => ({
    documentId,
    parentStepId,
    fromUserId: createdBy,
    toUserId,
    action: 'forwarded' as const,
    stepStatus: 'in_work' as const,
    notes,
    isExpired: false,
  }));

  await db.insert(generalRegisterWorkflow).values(workflowSteps);
}

async function createResolutionWorkflowStep(
  documentId: string,
  userId: string,
  solutionStatus: 'approved' | 'rejected',
  notes: string | null
): Promise<void> {
  await db.insert(generalRegisterWorkflow).values({
    documentId,
    parentStepId: null,
    fromUserId: userId,
    toUserId: userId,
    action: solutionStatus,
    stepStatus: 'resolved',
    resolutionStatus: solutionStatus,
    notes,
    isExpired: false,
    completedAt: new Date(),
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

function sanitizeForNotification(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

function validateNotificationBatchSize(userIds: string[]): string[] {
  if (userIds.length <= MAX_NOTIFICATION_BATCH_SIZE) {
    return userIds;
  }
  return userIds.slice(0, MAX_NOTIFICATION_BATCH_SIZE);
}

async function sendDocumentRedirectNotifications(
  documentId: string,
  documentSubject: string,
  userIds: string[],
  createdBy: string
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  const validUserIds = validateNotificationBatchSize(userIds);

  try {
    const truncatedSubject = truncateText(documentSubject, MAX_SUBJECT_LENGTH_IN_MESSAGE);
    const sanitizedSubject = sanitizeForNotification(truncatedSubject);

    const notificationsToCreate = validUserIds.map(userId => ({
      userId,
      title: NOTIFICATION_TITLES.documentRedirected,
      message: NOTIFICATION_MESSAGES.documentRedirected(sanitizedSubject),
      type: NOTIFICATION_TYPE,
      module: NOTIFICATION_MODULE,
      link: `/dashboard/registry/general-register/${documentId}`,
      createdBy,
      isRead: false,
      readAt: null,
    }));

    await db.insert(notifications).values(notificationsToCreate);
  } catch (error) {
    logError(error, {
      endpoint: 'general-register-service',
      method: 'sendDocumentRedirectNotifications',
    });
  }
}

/**
 * Update a general register document with workflow side-effects
 */
export async function updateGeneralRegisterDocument(
  id: string,
  data: UpdateGeneralRegisterDocumentInput,
  userId: string,
  options: { hasUpdatePermission: boolean }
) {
  const document = await getGeneralRegisterDocument(id);

  if (data.solutionStatus === 'redirected') {
    const isCreator = document.createdBy === userId;
    if (!isCreator && !options.hasUpdatePermission) {
      throw new AuthorizationError('Only document creator can redirect documents');
    }
  }

  const distributedUserIds = data.distributedUserIds || [];
  const validUserIds = await validateUserIds(distributedUserIds);

  const newStatus = calculateStatusFromSolution(data.solutionStatus || null, validUserIds);

  const updateData: {
    updatedBy: string;
    updatedAt: Date;
    status: DocumentStatus;
    subject?: string;
    description?: string | null;
    dueDate?: string | null;
    resolutionStatus?: 'approved' | 'rejected' | null;
    resolution?: string | null;
  } = {
    updatedBy: userId,
    updatedAt: new Date(),
    status: newStatus,
  };

  if (data.subject !== undefined) {
    updateData.subject = data.subject;
  }
  if (data.description !== undefined) {
    updateData.description = data.description;
  }
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate || null;
  }

  if (data.solutionStatus === 'approved' || data.solutionStatus === 'rejected') {
    updateData.resolutionStatus = data.solutionStatus;
    updateData.resolution = data.notes || null;
  } else {
    updateData.resolutionStatus = null;
    updateData.resolution = null;
  }

  const [updatedDocument] = await db
    .update(generalRegister)
    .set(updateData)
    .where(eq(generalRegister.id, id))
    .returning();

  if (!updatedDocument) {
    throw new ValidationError('Failed to update document');
  }

  const existingSteps = await db
    .select()
    .from(generalRegisterWorkflow)
    .where(eq(generalRegisterWorkflow.documentId, id));

  if (existingSteps.length === 0) {
    const creatorStepId = await createCreatorWorkflowStep(
      id,
      document.createdBy,
      data.solutionStatus || null,
      data.notes || null
    );

    if (validUserIds.length > 0) {
      await createDistributionWorkflowSteps(
        id,
        document.createdBy,
        validUserIds,
        data.notes || null,
        creatorStepId
      );
    }
  } else if (data.solutionStatus === 'approved' || data.solutionStatus === 'rejected') {
    const currentInWorkSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.documentId, id),
          eq(generalRegisterWorkflow.toUserId, userId),
          eq(generalRegisterWorkflow.stepStatus, 'in_work')
        )
      );

    if (currentInWorkSteps.length > 0) {
      await db
        .update(generalRegisterWorkflow)
        .set({
          stepStatus: 'resolved',
          resolutionStatus: data.solutionStatus,
          resolution: data.notes || null,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'in_work')
          )
        );
    } else {
      await createResolutionWorkflowStep(id, userId, data.solutionStatus, data.notes || null);
    }
  } else if (data.solutionStatus === 'redirected' && validUserIds.length > 0) {
    const currentInWorkSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(
        and(
          eq(generalRegisterWorkflow.documentId, id),
          eq(generalRegisterWorkflow.toUserId, userId),
          eq(generalRegisterWorkflow.stepStatus, 'in_work')
        )
      );

    if (currentInWorkSteps.length > 0) {
      await db
        .update(generalRegisterWorkflow)
        .set({
          stepStatus: 'redirected',
          notes: data.notes || null,
        })
        .where(
          and(
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'in_work')
          )
        );
    }

    const parentStepId = currentInWorkSteps.length > 0 ? currentInWorkSteps[0].id : null;
    await createDistributionWorkflowSteps(
      id,
      userId,
      validUserIds,
      data.notes || null,
      parentStepId
    );
  } else if (!data.solutionStatus) {
    if (data.notes) {
      const currentInWorkSteps = await db
        .select()
        .from(generalRegisterWorkflow)
        .where(
          and(
            eq(generalRegisterWorkflow.documentId, id),
            eq(generalRegisterWorkflow.toUserId, userId),
            eq(generalRegisterWorkflow.stepStatus, 'in_work')
          )
        );

      if (currentInWorkSteps.length > 0) {
        await db
          .update(generalRegisterWorkflow)
          .set({
            notes: data.notes,
          })
          .where(
            and(
              eq(generalRegisterWorkflow.documentId, id),
              eq(generalRegisterWorkflow.toUserId, userId),
              eq(generalRegisterWorkflow.stepStatus, 'in_work')
            )
          );
      }
    }
  }

  if (data.solutionStatus === 'redirected' && validUserIds.length > 0) {
    await sendDocumentRedirectNotifications(
      id,
      updatedDocument.subject,
      validUserIds,
      userId
    );
  }

  return updatedDocument;
}

/**
 * Delete a general register document (workflow/attachments cascade in DB)
 */
export async function deleteGeneralRegisterDocument(id: string) {
  const document = await getGeneralRegisterDocument(id);

  await db.delete(generalRegister).where(eq(generalRegister.id, id));

  return { id: document.id };
}
