import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { payments } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, gte, lte, and, sql } from 'drizzle-orm';

/**
 * GET /api/accounting/payments/summary - Get payment summary (totals by type)
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/accounting/payments/summary - Fetching payment summary');

  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const type = searchParams.get('type'); // Optional: filter by type

    console.log(`Step 2: Query parameters - parishId: ${parishId}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, type: ${type}`);

    // Build query conditions
    const conditions = [];

    if (parishId) {
      conditions.push(eq(payments.parishId, parishId));
    }

    if (dateFrom) {
      conditions.push(gte(payments.date, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(payments.date, dateTo));
    }

    if (type) {
      conditions.push(eq(payments.type, type as 'income' | 'expense'));
    }

    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions as any[]))
      : undefined;

    // Calculate summary using SQL aggregation
    let summaryQuery = db
      .select({
        totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type} = 'income' THEN ${payments.amount}::numeric ELSE 0 END), 0)`,
        totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${payments.type} = 'expense' THEN ${payments.amount}::numeric ELSE 0 END), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments);

    const finalSummaryQuery = whereClause ? summaryQuery.where(whereClause) : summaryQuery;

    const summaryResult = await finalSummaryQuery;
    const summary = summaryResult[0];

    if (!summary) {
      return NextResponse.json({
        success: true,
        data: {
          totalIncome: 0,
          totalExpense: 0,
          net: 0,
          count: 0,
        },
      });
    }

    const totalIncome = Number(summary.totalIncome || 0);
    const totalExpense = Number(summary.totalExpense || 0);
    const net = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        net,
        count: Number(summary.count || 0),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching payment summary:', error);
    logError(error, { endpoint: '/api/accounting/payments/summary', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}





