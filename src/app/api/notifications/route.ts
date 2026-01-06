import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { notifications, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and, desc, sql, inArray, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { formatValidationErrors } from '@/lib/api-utils/validation';
import { requireCsrfToken } from '@/lib/middleware/csrf';
import { checkRateLimit } from '@/lib/rate-limit';

// Constants
const MAX_BATCH_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const VALID_NOTIFICATION_TYPES = ['info', 'warning', 'error', 'success'] as const;
type NotificationType = typeof VALID_NOTIFICATION_TYPES[number];

/**
 * Validate and normalize pagination parameters
 */
function validatePagination(
  page: string | null,
  pageSize: string | null,
  maxPageSize: number = MAX_PAGE_SIZE
) {
  const pageNum = Math.max(1, parseInt(page || '1') || 1);
  const pageSizeNum = Math.min(maxPageSize, Math.max(1, parseInt(pageSize || String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE));
  return { page: pageNum, pageSize: pageSizeNum };
}

/**
 * Build WHERE clause from conditions array
 */
function buildWhereClause(conditions: SQL[]): SQL | undefined {
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/**
 * Validate notification type
 */
function isValidNotificationType(type: string | null): type is NotificationType {
  return type !== null && VALID_NOTIFICATION_TYPES.includes(type as NotificationType);
}

const createNotificationSchema = z.object({
  userIds: z.array(z.string().uuid('Invalid user ID'))
    .min(1, 'At least one user ID is required')
    .max(MAX_BATCH_SIZE, `Maximum ${MAX_BATCH_SIZE} users allowed per batch`),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(VALID_NOTIFICATION_TYPES, {
    errorMap: () => ({ message: `Type must be one of: ${VALID_NOTIFICATION_TYPES.join(', ')}` }),
  }),
  module: z.string().max(100).optional().nullable(),
  link: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/notifications - List notifications for current user with pagination, filtering, and sorting
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/notifications - Fetching notifications');

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = validatePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );
    const isReadParam = searchParams.get('is_read');
    const typeParam = searchParams.get('type');

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, isRead: ${isReadParam}, type: ${typeParam}`);

    // Build query conditions - always filter by current user
    const conditions: SQL[] = [eq(notifications.userId, userId)];

    // Filter by read status
    if (isReadParam !== null && isReadParam !== undefined) {
      conditions.push(eq(notifications.isRead, isReadParam === 'true'));
    }

    // Filter by type
    if (isValidNotificationType(typeParam)) {
      conditions.push(eq(notifications.type, typeParam));
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    const baseCountQuery = db.select({ count: sql<number>`count(*)` }).from(notifications);
    const countQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const baseQuery = db.select().from(notifications);
    const queryWithWhere = whereClause ? baseQuery.where(whereClause) : baseQuery;
    const queryWithOrder = queryWithWhere.orderBy(desc(notifications.createdAt));

    const allNotifications = await queryWithOrder.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allNotifications,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    logError(error, { endpoint: '/api/notifications', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/notifications - Create notifications for multiple users
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/notifications - Creating notifications');

  try {
    // CSRF protection
    const csrfError = await requireCsrfToken(request);
    if (csrfError) return csrfError;

    // Rate limiting (10 requests per minute)
    const rateLimitResult = await checkRateLimit(request, 10, 60000);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // Authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Authorization - check permission to create notifications
    const hasPermission = await checkPermission('notifications.create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
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

    const validation = createNotificationSchema.safeParse(body);

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

    // Verify all user IDs exist
    console.log(`Step 2: Verifying ${data.userIds.length} user IDs`);
    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, data.userIds));

    const existingUserIds = new Set(existingUsers.map(u => u.id));
    const invalidUserIds = data.userIds.filter(id => !existingUserIds.has(id));

    if (invalidUserIds.length > 0) {
      // Log detailed error server-side (don't expose user IDs in client response)
      console.log(`❌ Invalid user IDs: ${invalidUserIds.join(', ')}`);
      return NextResponse.json(
        { 
          success: false, 
          error: `One or more user IDs are invalid`,
          details: invalidUserIds.length === 1 
            ? 'One user ID was invalid' 
            : `${invalidUserIds.length} user IDs were invalid`
        },
        { status: 400 }
      );
    }

    // Create notifications for each user
    console.log(`Step 3: Creating notifications for ${data.userIds.length} users`);
    const notificationsToCreate = data.userIds.map(targetUserId => ({
      userId: targetUserId,
      title: data.title,
      message: data.message,
      type: data.type,
      module: data.module || null,
      link: data.link || null,
      createdBy: userId, // The current authenticated user creating the notifications
      isRead: false,
      readAt: null,
    }));

    const createdNotifications = await db
      .insert(notifications)
      .values(notificationsToCreate)
      .returning();

    console.log(`✓ Created ${createdNotifications.length} notifications`);
    return NextResponse.json(
      {
        success: true,
        data: createdNotifications,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    logError(error, { endpoint: '/api/notifications', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

