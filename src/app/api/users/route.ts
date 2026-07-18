import { NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth';
import { extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';
import { parsePaginationParams } from '@/lib/api-utils/pagination';
import { parseSortOrder } from '@/lib/api-utils/sorting';
import { handleApiRoute, createSuccessResponse, createErrorResponse } from '@/lib/api-utils/error-handling';
import { ADMINISTRATION_PERMISSIONS } from '@/lib/permissions/administration';
import { createUserSchema, updateUserSchema } from '@/lib/validations/users';
import {
  listUsers,
  createUser,
  updateUser,
  softDeleteUser,
} from '@/lib/services/users-service';

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Fetch all users with pagination, filtering, and sorting
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 */
export async function GET(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ADMINISTRATION_PERMISSIONS.USERS_VIEW);

    const { searchParams } = new URL(request.url);
    const { page, pageSize, offset } = parsePaginationParams(searchParams);

    const result = await listUsers({
      page,
      pageSize,
      offset,
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      approvalStatus: searchParams.get('approvalStatus'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: parseSortOrder(searchParams.get('sortOrder')),
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  }, { endpoint: '/api/users', method: 'GET' });
}

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 */
export async function POST(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ADMINISTRATION_PERMISSIONS.USERS_CREATE);
    const { userId } = await requireAuth();

    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const newUser = await createUser(validation.data, userId, {
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      requestMethod: 'POST',
      endpoint: '/api/users',
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  }, { endpoint: '/api/users', method: 'POST' });
}

/**
 * PUT /api/users - Update user details
 */
export async function PUT(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ADMINISTRATION_PERMISSIONS.USERS_UPDATE);
    const { userId: currentUserId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        validation.error.errors[0]?.message || 'Validation failed',
        400
      );
    }

    const updatedUser = await updateUser(userId, validation.data, currentUserId, {
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      requestMethod: 'PUT',
      endpoint: '/api/users',
    });

    return createSuccessResponse(updatedUser);
  }, { endpoint: '/api/users', method: 'PUT' });
}

/**
 * DELETE /api/users - Soft-delete a user
 */
export async function DELETE(request: Request) {
  return handleApiRoute(async () => {
    await requirePermission(ADMINISTRATION_PERMISSIONS.USERS_DELETE);
    const { userId: currentUserId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    await softDeleteUser(userId, currentUserId, {
      ipAddress: extractIpAddress(request),
      userAgent: extractUserAgent(request),
      requestMethod: 'DELETE',
      endpoint: '/api/users',
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  }, { endpoint: '/api/users', method: 'DELETE' });
}
