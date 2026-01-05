import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { generalRegister, generalRegisterWorkflow, users, notifications } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { requireParishAccess } from '@/lib/api-utils/authorization';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { eq, inArray, and } from 'drizzle-orm';
import { z } from 'zod';

// Constants
const MAX_NOTIFICATION_BATCH_SIZE = 100; // Maximum number of notifications to create in one batch
const MAX_SUBJECT_LENGTH_IN_MESSAGE = 200; // Maximum length of document subject to include in notification message
const NOTIFICATION_MODULE = 'registratura' as const;
const NOTIFICATION_TYPE = 'info' as const;

// Notification message templates (Romanian - default locale)
// TODO: Implement i18n support by fetching user locale preferences from database
// and using server-side translations (e.g., next-intl/getTranslations)
const NOTIFICATION_TITLES = {
  documentRedirected: 'Document redirectat către tine',
} as const;

const NOTIFICATION_MESSAGES = {
  documentRedirected: (subject: string) => 
    `Un document a fost redirectat către tine pentru rezolvare: "${subject}"`,
} as const;

/**
 * GET /api/registratura/general-register/[id] - Get document by ID
 * 
 * Security:
 * - Requires authentication
 * - Validates UUID format for document ID
 * - Validates user has access to document's parish
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format early
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    console.log(`Step 1: GET /api/registratura/general-register/[id] - Fetching document`);
    
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      // Generic error message to prevent information disclosure
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Authorization check: Verify user has access to the document's parish
    if (document.parishId) {
      try {
        await requireParishAccess(document.parishId, false);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: 'You do not have access to this document' },
            { status: 403 }
          );
        }
        throw error;
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ Document ${id} found`);
    } else {
      console.log(`✓ Document found`);
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/registratura/general-register/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

const updateDocumentSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(500).optional(),
  description: z.string().optional().nullable(),
  solutionStatus: z.enum(['approved', 'rejected', 'redirected']).optional().nullable(),
  distributedUserIds: z.array(z.string().uuid()).optional().default([]),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type DocumentStatus = 'draft' | 'in_work' | 'distributed' | 'resolved' | 'cancelled';
type SolutionStatus = 'approved' | 'rejected' | 'redirected' | null;

/**
 * Calculate document status based on solution status and distributed users
 */
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

/**
 * Validate that all user IDs exist in the database and are active
 * Filters out invalid, non-existent, or inactive users
 * @param userIds - Array of user IDs to validate
 * @returns Array of valid, active user IDs
 */
async function validateUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }
  
  // Get users including their active status
  const validUsers = await db
    .select({ id: users.id, isActive: users.isActive })
    .from(users)
    .where(
      and(
        inArray(users.id, userIds),
        eq(users.isActive, true) // Only include active users
      )
    );
  
  const validActiveUserIds = validUsers.map(user => user.id);
  const invalidUserIds = userIds.filter(id => !validActiveUserIds.includes(id));
  
  if (invalidUserIds.length > 0) {
    // Log warning but don't expose user IDs in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️ Invalid or inactive user IDs filtered: ${invalidUserIds.length} user(s)`);
    } else {
      console.log(`⚠️ Invalid or inactive user IDs filtered: ${invalidUserIds.length} user(s)`);
    }
  }
  
  return validActiveUserIds;
}

/**
 * Create initial workflow step for document creator
 */
async function createCreatorWorkflowStep(
  documentId: string,
  createdBy: string,
  solutionStatus: SolutionStatus,
  notes: string | null
): Promise<void> {
  const isResolved = solutionStatus === 'approved' || solutionStatus === 'rejected';
  
  await db.insert(generalRegisterWorkflow).values({
    documentId,
    parentStepId: null,
    fromUserId: createdBy,
    toUserId: createdBy,
    action: 'sent',
    stepStatus: 'completed',
    resolutionStatus: solutionStatus === 'approved' ? 'approved' : 
                     solutionStatus === 'rejected' ? 'rejected' : null,
    notes,
    isExpired: false,
    completedAt: isResolved ? new Date() : null,
  });
}

/**
 * Create workflow steps for distributed users
 */
async function createDistributionWorkflowSteps(
  documentId: string,
  createdBy: string,
  toUserIds: string[],
  notes: string | null
): Promise<void> {
  if (toUserIds.length === 0) {
    return;
  }
  
  const workflowSteps = toUserIds.map(toUserId => ({
    documentId,
    parentStepId: null,
    fromUserId: createdBy,
    toUserId,
    action: 'forwarded' as const,
    stepStatus: 'pending' as const,
    notes,
    isExpired: false,
  }));
  
  await db.insert(generalRegisterWorkflow).values(workflowSteps);
}

/**
 * Create resolution workflow step
 */
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
    stepStatus: 'completed',
    resolutionStatus: solutionStatus,
    notes,
    isExpired: false,
    completedAt: new Date(),
  });
}

/**
 * Truncates text to a maximum length, appending ellipsis if truncated
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if necessary
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitizes text for safe display in notifications to prevent XSS attacks
 * Escapes HTML special characters and removes potential script tags
 * @param text - The text to sanitize
 * @returns Sanitized text safe for HTML display
 */
function sanitizeForNotification(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Builds the notification link for a document detail page
 * @param documentId - The ID of the document
 * @returns Relative path to the document detail page
 */
function buildDocumentNotificationLink(documentId: string): string {
  return `/dashboard/registry/general-register/${documentId}`;
}

/**
 * Validates that the notification batch size is within acceptable limits
 * @param userIds - Array of user IDs to notify
 * @returns Truncated array if necessary, or original array if within limits
 */
function validateNotificationBatchSize(userIds: string[]): string[] {
  if (userIds.length <= MAX_NOTIFICATION_BATCH_SIZE) {
    return userIds;
  }
  
  console.warn(
    `⚠️ Notification batch size (${userIds.length}) exceeds maximum (${MAX_NOTIFICATION_BATCH_SIZE}). ` +
    `Truncating to first ${MAX_NOTIFICATION_BATCH_SIZE} users.`
  );
  
  return userIds.slice(0, MAX_NOTIFICATION_BATCH_SIZE);
}

/**
 * Creates notification data for a single user when a document is redirected
 * @param userId - The user ID to notify
 * @param documentId - The ID of the redirected document
 * @param documentSubject - The subject of the document (will be truncated and sanitized)
 * @param createdBy - User ID of the person redirecting the document
 * @returns Notification data object
 */
function createDocumentRedirectNotification(
  userId: string,
  documentId: string,
  documentSubject: string,
  createdBy: string
) {
  // Truncate and sanitize subject to prevent XSS
  const truncatedSubject = truncateText(documentSubject, MAX_SUBJECT_LENGTH_IN_MESSAGE);
  const sanitizedSubject = sanitizeForNotification(truncatedSubject);
  
  return {
    userId,
    title: NOTIFICATION_TITLES.documentRedirected,
    message: NOTIFICATION_MESSAGES.documentRedirected(sanitizedSubject),
    type: NOTIFICATION_TYPE,
    module: NOTIFICATION_MODULE,
    link: buildDocumentNotificationLink(documentId),
    createdBy,
    isRead: false,
    readAt: null,
  };
}

/**
 * Sends in-app notifications to users when a document is redirected to them.
 * 
 * This function creates notifications for each user in the provided list, informing them
 * that a document has been redirected to them for resolution. Notifications are created
 * asynchronously and errors are logged but do not prevent the document update from succeeding.
 * 
 * @param documentId - The ID of the document being redirected
 * @param documentSubject - The subject/title of the document (will be truncated if too long)
 * @param userIds - Array of user IDs to notify (must be valid UUIDs that exist in the database)
 * @param createdBy - User ID of the person redirecting the document
 * @returns Promise that resolves when notifications are created (or failed silently)
 * 
 * @remarks
 * - If userIds is empty, the function returns early without doing anything
 * - If the batch size exceeds MAX_NOTIFICATION_BATCH_SIZE, it's truncated to prevent abuse
 * - Errors during notification creation are logged but don't throw, ensuring document updates succeed
 * - Document subject is truncated to MAX_SUBJECT_LENGTH_IN_MESSAGE to keep notification messages readable
 * 
 * @example
 * ```typescript
 * await sendDocumentRedirectNotifications(
 *   'doc-uuid',
 *   'Important document about...',
 *   ['user1-uuid', 'user2-uuid'],
 *   'current-user-uuid'
 * );
 * ```
 */
async function sendDocumentRedirectNotifications(
  documentId: string,
  documentSubject: string,
  userIds: string[],
  createdBy: string
): Promise<void> {
  // Early return if no users to notify
  if (userIds.length === 0) {
    return;
  }

  // Validate and limit batch size
  const validUserIds = validateNotificationBatchSize(userIds);

  try {
    // Create notification data for each user
    const notificationsToCreate = validUserIds.map(userId =>
      createDocumentRedirectNotification(userId, documentId, documentSubject, createdBy)
    );

    // Insert all notifications in a single database operation
    await db.insert(notifications).values(notificationsToCreate);
    
    // Log success with sanitized information (don't expose IDs in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✓ Created ${notificationsToCreate.length} notification(s) for document redirect (documentId: ${documentId})`
      );
    } else {
      console.log(
        `✓ Created ${notificationsToCreate.length} notification(s) for document redirect`
      );
    }
  } catch (error) {
    // Log error but don't fail the document update if notifications fail
    // Notifications are a secondary concern - document state is primary
    console.error('❌ Error creating redirect notifications:', error);
    logError(error, { 
      endpoint: '/api/registratura/general-register/[id]', 
      method: 'PATCH',
      context: 'sendDocumentRedirectNotifications',
      // Only include sensitive data in development logs
      ...(process.env.NODE_ENV === 'development' && {
        documentId,
        userIdCount: validUserIds.length,
      }),
    });
  }
}

/**
 * PATCH /api/registratura/general-register/[id] - Update document with automatic status calculation
 * 
 * Security:
 * - Requires authentication
 * - Validates user has 'registratura:update' permission
 * - Validates user has access to document's parish
 * - Validates UUID format for document ID
 * - Only allows redirect if user is creator or has 'registratura:redirect_any' permission
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Validate UUID format early to prevent unnecessary processing
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    console.log(`[API PATCH /api/registratura/general-register/[id]] Request received`);

    // Authentication check
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Authorization check: Verify user has permission to update documents
    const hasUpdatePermission = await checkPermission('registratura:update');
    if (!hasUpdatePermission) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update documents' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = updateDocumentSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if document exists
    const [document] = await db
      .select()
      .from(generalRegister)
      .where(eq(generalRegister.id, id))
      .limit(1);

    if (!document) {
      // Generic error message to prevent information disclosure
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Authorization check: Verify user has access to the document's parish
    if (document.parishId) {
      try {
        await requireParishAccess(document.parishId, false); // false = read access sufficient for now
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: 'You do not have access to this document' },
            { status: 403 }
          );
        }
        throw error;
      }
    }

    // Additional authorization: Only allow redirecting if user is creator OR has redirect_any permission
    if (data.solutionStatus === 'redirected') {
      const isCreator = document.createdBy === userId;
      const canRedirectAny = await checkPermission('registratura:redirect_any');
      
      if (!isCreator && !canRedirectAny) {
        return NextResponse.json(
          { success: false, error: 'Only document creator can redirect documents' },
          { status: 403 }
        );
      }
    }

    // Validate and filter distributed user IDs (only active users)
    const distributedUserIds = data.distributedUserIds || [];
    const validUserIds = await validateUserIds(distributedUserIds);
    
    if (validUserIds.length !== distributedUserIds.length) {
      const filteredCount = distributedUserIds.length - validUserIds.length;
      console.log(`⚠️ Filtered out ${filteredCount} invalid or inactive user(s), using ${validUserIds.length} valid user(s)`);
    }

    // Calculate status automatically based on solution and distributions
    const newStatus = calculateStatusFromSolution(
      data.solutionStatus || null,
      validUserIds
    );

    // Prepare update data with proper types
    const updateData: {
      updatedBy: string;
      updatedAt: Date;
      status: DocumentStatus;
      subject?: string;
      description?: string | null;
      dueDate?: Date | null;
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
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    }

    // Update document
    const [updatedDocument] = await db
      .update(generalRegister)
      .set(updateData)
      .where(eq(generalRegister.id, id))
      .returning();

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }

    // Check if workflow steps already exist for this document
    const existingSteps = await db
      .select()
      .from(generalRegisterWorkflow)
      .where(eq(generalRegisterWorkflow.documentId, id));

    // Only create workflow steps if this is the first save (no existing steps)
    if (existingSteps.length === 0) {
      // Create creator workflow step
      await createCreatorWorkflowStep(
        id,
        document.createdBy,
        data.solutionStatus || null,
        data.notes || null
      );

      // Create distribution workflow steps if users are distributed
      if (validUserIds.length > 0) {
        await createDistributionWorkflowSteps(
          id,
          document.createdBy,
          validUserIds,
          data.notes || null
        );
      }
    } else if (data.solutionStatus === 'approved' || data.solutionStatus === 'rejected') {
      // If workflow steps exist and we're resolving, create resolution step
      await createResolutionWorkflowStep(
        id,
        userId,
        data.solutionStatus,
        data.notes || null
      );
    }

    // Send notifications when document is redirected to users
    if (data.solutionStatus === 'redirected' && validUserIds.length > 0) {
      await sendDocumentRedirectNotifications(
        id,
        updatedDocument.subject,
        validUserIds,
        userId
      );
    }

    // Log success (sanitized for production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✓ Document ${id} updated successfully with status: ${newStatus}`);
    } else {
      console.log(`✓ Document updated successfully with status: ${newStatus}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('❌ Error updating document:', error);
    logError(error, { endpoint: '/api/registratura/general-register/[id]', method: 'PATCH' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

