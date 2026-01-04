import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { receipts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, max, sql } from 'drizzle-orm';

/**
 * GET /api/parishioners/receipts/next-number - Get next receipt number for a parish
 * Query params: parishId (optional - if not provided, generates global next number)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');

    // Build conditions for finding max number
    const conditions = [];

    if (parishId) {
      conditions.push(eq(receipts.parishId, parishId));
    }

    // Get max number - extract numeric part from receipt_number
    // Assuming receipt numbers are in format like "CH-001", "CH-002", etc.
    // or just numeric "001", "002", etc.
    let maxNumber = 0;

    if (conditions.length > 0) {
      const allReceipts = await db
        .select({ receiptNumber: receipts.receiptNumber })
        .from(receipts)
        .where(and(...conditions));

      // Extract numeric parts and find max
      for (const receipt of allReceipts) {
        const numericPart = receipt.receiptNumber.match(/\d+/);
        if (numericPart) {
          const num = parseInt(numericPart[0], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    } else {
      // Global max number
      const allReceipts = await db
        .select({ receiptNumber: receipts.receiptNumber })
        .from(receipts);

      for (const receipt of allReceipts) {
        const numericPart = receipt.receiptNumber.match(/\d+/);
        if (numericPart) {
          const num = parseInt(numericPart[0], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    const nextNumber = maxNumber + 1;

    return NextResponse.json({
      success: true,
      data: {
        nextNumber,
        parishId: parishId || null,
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/next-number', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

