import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimagePayments, pilgrimageParticipants } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

/**
 * GET /api/pilgrimages/[id]/payments/summary - Get payment summary for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
        { status: 400 }
      );
    }

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Get payment statistics
    const paymentStats = await db
      .select({
        totalAmount: sql<number>`coalesce(sum(${pilgrimagePayments.amount}), 0)`,
        totalPayments: sql<number>`count(*)`,
        completedAmount: sql<number>`coalesce(sum(${pilgrimagePayments.amount}) filter (where ${pilgrimagePayments.status} = 'completed'), 0)`,
        pendingAmount: sql<number>`coalesce(sum(${pilgrimagePayments.amount}) filter (where ${pilgrimagePayments.status} = 'pending'), 0)`,
        byMethod: sql<any>`jsonb_object_agg(${pilgrimagePayments.paymentMethod}, coalesce(sum(${pilgrimagePayments.amount}), 0)) filter (where ${pilgrimagePayments.status} = 'completed')`,
      })
      .from(pilgrimagePayments)
      .where(eq(pilgrimagePayments.pilgrimageId, id));

    // Get expected revenue from participants
    const expectedRevenue = await db
      .select({
        total: sql<number>`coalesce(sum(${pilgrimageParticipants.totalAmount}), 0)`,
        paid: sql<number>`coalesce(sum(${pilgrimageParticipants.paidAmount}), 0)`,
        outstanding: sql<number>`coalesce(sum(${pilgrimageParticipants.totalAmount} - ${pilgrimageParticipants.paidAmount}), 0)`,
      })
      .from(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.pilgrimageId, id),
          sql`${pilgrimageParticipants.status} != 'cancelled'`
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentStats[0] || {
          totalAmount: 0,
          totalPayments: 0,
          completedAmount: 0,
          pendingAmount: 0,
          byMethod: {},
        },
        revenue: expectedRevenue[0] || {
          total: 0,
          paid: 0,
          outstanding: 0,
        },
      },
    });
  } catch (error) {
    console.error('❌ Error fetching payment summary:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/payments/summary', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

