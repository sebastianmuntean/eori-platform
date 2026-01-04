import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventEmailSubmissions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, desc, asc, and, like, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { validatePagination, buildWhereClause } from '@/lib/services/events-service';

/**
 * GET /api/events/email-submissions - Get all email submissions with pagination and filtering
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/events/email-submissions - Fetching email submissions');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view email submissions
    const hasPermission = await checkPermission('events:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const { page, pageSize } = validatePagination(
      searchParams.get('page'),
      searchParams.get('pageSize')
    );
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'pending' | 'processed' | 'error'

    console.log(`Step 2: Query parameters - page: ${page}, pageSize: ${pageSize}, search: ${search}, status: ${status}`);

    // Build query conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(churchEventEmailSubmissions.fromEmail, `%${search}%`),
          like(churchEventEmailSubmissions.subject || '', `%${search}%`),
          like(churchEventEmailSubmissions.content, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(churchEventEmailSubmissions.status, status as 'pending' | 'processed' | 'error'));
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(churchEventEmailSubmissions);
    if (whereClause) {
      countQuery = countQuery.where(whereClause);
    }
    const totalCountResult = await countQuery;
    const totalCount = Number(totalCountResult[0]?.count || 0);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    let query = db.select().from(churchEventEmailSubmissions);
    if (whereClause) {
      query = query.where(whereClause);
    }

    // Order by created date (newest first)
    query = query.orderBy(desc(churchEventEmailSubmissions.createdAt));

    const allSubmissions = await query.limit(pageSize).offset(offset);

    return NextResponse.json({
      success: true,
      data: allSubmissions,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching email submissions:', error);
    logError(error, { endpoint: '/api/events/email-submissions', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



