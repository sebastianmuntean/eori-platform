import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteries, cemeteryParcels, cemeteryRows, cemeteryGraves, cemeteryConcessions, cemeteryConcessionPayments, burials } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { validateUuid } from '@/lib/utils/cemetery';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Verify cemetery exists
    const [cemetery] = await db
      .select()
      .from(cemeteries)
      .where(eq(cemeteries.id, id))
      .limit(1);

    if (!cemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    // Get counts
    const [parcelsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.cemeteryId, id));

    const [rowsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryRows)
      .where(eq(cemeteryRows.cemeteryId, id));

    const gravesByStatus = await db
      .select({
        status: cemeteryGraves.status,
        count: sql<number>`count(*)`,
      })
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.cemeteryId, id))
      .groupBy(cemeteryGraves.status);

    const [concessionsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryConcessions)
      .where(
        and(
          eq(cemeteryConcessions.cemeteryId, id),
          eq(cemeteryConcessions.status, 'active')
        )
      );

    const [burialsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(burials)
      .where(eq(burials.cemeteryId, id));

    // Calculate total payments amount
    const paymentsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${cemeteryConcessionPayments.amount}::numeric), 0)`,
      })
      .from(cemeteryConcessionPayments)
      .innerJoin(cemeteryConcessions, eq(cemeteryConcessionPayments.concessionId, cemeteryConcessions.id))
      .where(eq(cemeteryConcessions.cemeteryId, id));

    const gravesStats = {
      total: 0,
      free: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
    };

    gravesByStatus.forEach((row: { status: string | null; count: number }) => {
      gravesStats.total += Number(row.count);
      if (row.status === 'free') gravesStats.free = Number(row.count);
      if (row.status === 'occupied') gravesStats.occupied = Number(row.count);
      if (row.status === 'reserved') gravesStats.reserved = Number(row.count);
      if (row.status === 'maintenance') gravesStats.maintenance = Number(row.count);
    });

    return NextResponse.json({
      success: true,
      data: {
        cemetery: {
          id: cemetery.id,
          name: cemetery.name,
          code: cemetery.code,
          totalArea: cemetery.totalArea,
          totalPlots: cemetery.totalPlots,
        },
        statistics: {
          parcels: Number(parcelsCount?.count || 0),
          rows: Number(rowsCount?.count || 0),
          graves: gravesStats,
          activeConcessions: Number(concessionsCount?.count || 0),
          burials: Number(burialsCount?.count || 0),
          totalPaymentsAmount: Number(paymentsResult[0]?.total || 0),
        },
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]/statistics', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

