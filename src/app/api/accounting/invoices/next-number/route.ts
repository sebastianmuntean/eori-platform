import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { invoices } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, max, or, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * GET /api/accounting/invoices/next-number - Get next invoice number for a series and warehouse
 * Query params: parishId, series, warehouseId (optional), type
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const series = searchParams.get('series');
    const warehouseId = searchParams.get('warehouseId');
    const type = searchParams.get('type');

    if (!parishId || !series || !type) {
      return NextResponse.json(
        { success: false, error: 'parishId, series, and type are required' },
        { status: 400 }
      );
    }

    // Build conditions for finding max number
    const conditions = [
      eq(invoices.parishId, parishId),
      eq(invoices.series, series),
      eq(invoices.type, type as 'issued' | 'received'),
    ];

    // If warehouseId is provided, filter by warehouseId (including null for invoices without warehouse)
    // If warehouseId is not provided, only get invoices without warehouse
    if (warehouseId) {
      conditions.push(eq(invoices.warehouseId, warehouseId));
    } else {
      conditions.push(isNull(invoices.warehouseId));
    }

    // Get max number for this series, parish, type, and warehouse
    const maxNumberResult = await db
      .select({ maxNumber: max(invoices.number) })
      .from(invoices)
      .where(and(...conditions));

    const maxNumber = maxNumberResult[0]?.maxNumber
      ? Number(maxNumberResult[0].maxNumber)
      : 0;

    const nextNumber = maxNumber + 1;

    return NextResponse.json({
      success: true,
      data: {
        nextNumber,
        series,
        warehouseId: warehouseId || null,
      },
    });
  } catch (error) {
    console.error('❌ Error getting next invoice number:', error);
    logError(error, { endpoint: '/api/accounting/invoices/next-number', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



