import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { validateDateRange, buildWhereClause } from '@/lib/services/events-service';

/**
 * GET /api/events/calendar - Get events for calendar view
 * Query params:
 *   - start: Start date (YYYY-MM-DD)
 *   - end: End date (YYYY-MM-DD)
 *   - parishId: Optional filter by parish
 *   - type: Optional filter by event type
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/events/calendar - Fetching calendar events');

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view events
    const hasPermission = await checkPermission('events:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start'); // YYYY-MM-DD
    const end = searchParams.get('end'); // YYYY-MM-DD
    const parishId = searchParams.get('parishId');
    const type = searchParams.get('type'); // 'wedding' | 'baptism' | 'funeral'

    // Validate date range
    try {
      validateDateRange(start, end);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid date range' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Query parameters - start: ${start}, end: ${end}, parishId: ${parishId}, type: ${type}`);

    // Build query conditions
    const conditions = [];

    if (start) {
      conditions.push(gte(churchEvents.eventDate, start));
    }

    if (end) {
      conditions.push(lte(churchEvents.eventDate, end));
    }

    if (parishId) {
      conditions.push(eq(churchEvents.parishId, parishId));
    }

    if (type) {
      conditions.push(eq(churchEvents.type, type as 'wedding' | 'baptism' | 'funeral'));
    }

    const whereClause = buildWhereClause(conditions);

    // Get events
    let query = db
      .select({
        id: churchEvents.id,
        type: churchEvents.type,
        status: churchEvents.status,
        eventDate: churchEvents.eventDate,
        location: churchEvents.location,
        priestName: churchEvents.priestName,
        parishId: churchEvents.parishId,
      })
      .from(churchEvents);

    const finalQuery = whereClause
      ? query.where(whereClause)
      : query;

    // Order by date
    const orderedQuery = finalQuery.orderBy(churchEvents.eventDate);

    const events = await orderedQuery;

    console.log(`✓ Found ${events.length} events for calendar`);

    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    logError(error, { endpoint: '/api/events/calendar', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}
