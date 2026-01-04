import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { validateDateRange, buildWhereClause } from '@/lib/services/events-service';

/**
 * GET /api/events/statistics - Get event statistics
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/events/statistics - Fetching statistics');

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
    const parishId = searchParams.get('parishId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate date range
    try {
      validateDateRange(startDate, endDate);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Invalid date range' },
        { status: 400 }
      );
    }

    console.log(`Step 2: Query parameters - parishId: ${parishId}, startDate: ${startDate}, endDate: ${endDate}`);

    // Build base conditions
    const conditions = [];
    if (parishId) {
      conditions.push(eq(churchEvents.parishId, parishId));
    }
    if (startDate) {
      conditions.push(gte(churchEvents.eventDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(churchEvents.eventDate, endDate));
    }

    const whereClause = buildWhereClause(conditions);

    // Get total count
    let totalQuery = db.select({ count: sql<number>`count(*)` }).from(churchEvents);
    if (whereClause) {
      totalQuery = totalQuery.where(whereClause);
    }
    const totalResult = await totalQuery;
    const total = Number(totalResult[0]?.count || 0);

    // Get counts by type
    let typeQuery = db
      .select({
        type: churchEvents.type,
        count: sql<number>`count(*)`,
      })
      .from(churchEvents)
      .groupBy(churchEvents.type);
    if (whereClause) {
      typeQuery = typeQuery.where(whereClause);
    }
    const typeResults = await typeQuery;
    const byType = {
      wedding: 0,
      baptism: 0,
      funeral: 0,
    };
    typeResults.forEach((row: any) => {
      if (row.type === 'wedding') byType.wedding = Number(row.count);
      else if (row.type === 'baptism') byType.baptism = Number(row.count);
      else if (row.type === 'funeral') byType.funeral = Number(row.count);
    });

    // Get counts by status
    let statusQuery = db
      .select({
        status: churchEvents.status,
        count: sql<number>`count(*)`,
      })
      .from(churchEvents)
      .groupBy(churchEvents.status);
    if (whereClause) {
      statusQuery = statusQuery.where(whereClause);
    }
    const statusResults = await statusQuery;
    const byStatus = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    statusResults.forEach((row: any) => {
      if (row.status === 'pending') byStatus.pending = Number(row.count);
      else if (row.status === 'confirmed') byStatus.confirmed = Number(row.count);
      else if (row.status === 'completed') byStatus.completed = Number(row.count);
      else if (row.status === 'cancelled') byStatus.cancelled = Number(row.count);
    });

    // Get counts by month (last 12 months) - optimized single query
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0];

    const monthConditions = [gte(churchEvents.eventDate, twelveMonthsAgoStr)];
    if (whereClause) {
      monthConditions.push(whereClause);
    }

    const monthQuery = db
      .select({
        month: sql<string>`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM')`,
        count: sql<number>`count(*)`,
      })
      .from(churchEvents)
      .where(monthConditions.length === 1 ? monthConditions[0] : and(...monthConditions))
      .groupBy(sql`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${churchEvents.eventDate}, 'YYYY-MM')`);

    const monthResults = await monthQuery;
    
    // Create a map for quick lookup
    const monthMap = new Map<string, number>();
    monthResults.forEach((row: any) => {
      monthMap.set(row.month, Number(row.count));
    });

    // Fill in all months for the last 12 months
    const byMonth: Array<{ month: string; count: number }> = [];
    const today = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      byMonth.push({
        month: monthStr,
        count: monthMap.get(monthStr) || 0,
      });
    }

    // Get upcoming events (eventDate >= today)
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingConditions = [
      gte(churchEvents.eventDate, todayStr),
      eq(churchEvents.status, 'confirmed'),
    ];
    if (whereClause) {
      upcomingConditions.push(whereClause);
    }
    const upcomingQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(churchEvents)
      .where(upcomingConditions.length === 1 ? upcomingConditions[0] : and(...upcomingConditions));
    const upcomingResult = await upcomingQuery;
    const upcoming = Number(upcomingResult[0]?.count || 0);

    const statistics = {
      total,
      byType,
      byStatus,
      byMonth,
      upcoming,
    };

    console.log(`✓ Statistics calculated: ${total} total events`);
    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    logError(error, { endpoint: '/api/events/statistics', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

