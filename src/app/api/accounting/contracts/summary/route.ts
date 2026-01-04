import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * GET /api/accounting/contracts/summary - Get contracts summary statistics
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/contracts/summary - Fetching summary');

  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build conditions
    const conditions = [];
    if (parishId) {
      conditions.push(eq(contracts.parishId, parishId));
    }
    if (dateFrom) {
      conditions.push(gte(contracts.startDate, dateFrom));
    }
    if (dateTo) {
      conditions.push(lte(contracts.endDate, dateTo));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get counts by status
    const activeCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.status, 'active')) : eq(contracts.status, 'active'));
    
    const expiredCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.status, 'expired')) : eq(contracts.status, 'expired'));
    
    const terminatedCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.status, 'terminated')) : eq(contracts.status, 'terminated'));

    // Get total counts by direction
    const incomingTotal = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.direction, 'incoming')) : eq(contracts.direction, 'incoming'));
    
    const outgoingTotal = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.direction, 'outgoing')) : eq(contracts.direction, 'outgoing'));

    // Get total amount by direction
    const incomingAmount = await db
      .select({ total: sql<number>`COALESCE(SUM(${contracts.amount}::numeric), 0)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.direction, 'incoming')) : eq(contracts.direction, 'incoming'));
    
    const outgoingAmount = await db
      .select({ total: sql<number>`COALESCE(SUM(${contracts.amount}::numeric), 0)` })
      .from(contracts)
      .where(whereClause ? and(whereClause, eq(contracts.direction, 'outgoing')) : eq(contracts.direction, 'outgoing'));

    // Get contracts expiring in next 30/60/90 days
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const expiring30Days = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(
        whereClause
          ? and(whereClause, eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, thirtyDaysFromNow))
          : and(eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, thirtyDaysFromNow))
      );

    const expiring60Days = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(
        whereClause
          ? and(whereClause, eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, sixtyDaysFromNow))
          : and(eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, sixtyDaysFromNow))
      );

    const expiring90Days = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(
        whereClause
          ? and(whereClause, eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, ninetyDaysFromNow))
          : and(eq(contracts.status, 'active'), gte(contracts.endDate, today), lte(contracts.endDate, ninetyDaysFromNow))
      );

    const summary = {
      totalActive: Number(activeCount[0]?.count || 0),
      totalExpired: Number(expiredCount[0]?.count || 0),
      totalTerminated: Number(terminatedCount[0]?.count || 0),
      totalIncoming: Number(incomingTotal[0]?.count || 0),
      totalOutgoing: Number(outgoingTotal[0]?.count || 0),
      totalIncomingAmount: Number(incomingAmount[0]?.total || 0),
      totalOutgoingAmount: Number(outgoingAmount[0]?.total || 0),
      expiringIn30Days: Number(expiring30Days[0]?.count || 0),
      expiringIn60Days: Number(expiring60Days[0]?.count || 0),
      expiringIn90Days: Number(expiring90Days[0]?.count || 0),
    };

    console.log(`✓ Summary fetched successfully`);
    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('❌ Error fetching contracts summary:', error);
    logError(error, { endpoint: '/api/accounting/contracts/summary', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



