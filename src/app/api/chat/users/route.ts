import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, or, like, asc, desc } from 'drizzle-orm';

/**
 * GET /api/chat/users - List users for creating conversations
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/chat/users - Fetching users for chat');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Build query conditions
    const conditions = [eq(users.isActive, true)];

    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.name, `%${search}%`)
        )!
      );
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: users.id })
      .from(users)
      .where(conditions[0] as any);
    const totalCount = totalCountResult.length;

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const baseQuery = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(conditions[0] as any);

    // Apply sorting
    const allUsers = await (() => {
      if (sortBy === 'name') {
        return sortOrder === 'desc'
          ? baseQuery.orderBy(desc(users.name))
          : baseQuery.orderBy(asc(users.name));
      } else if (sortBy === 'email') {
        return sortOrder === 'desc'
          ? baseQuery.orderBy(desc(users.email))
          : baseQuery.orderBy(asc(users.email));
      } else {
        return baseQuery.orderBy(asc(users.name));
      }
    })().limit(pageSize).offset(offset);

    console.log(`✓ Found ${allUsers.length} users (total: ${totalCount})`);

    return NextResponse.json({
      success: true,
      data: allUsers,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching users for chat:', error);
    logError(error, { endpoint: '/api/chat/users', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

