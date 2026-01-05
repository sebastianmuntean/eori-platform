import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryGraves, cemeteryConcessions, burials, cemeteries, cemeteryParcels, cemeteryRows, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { validateUuid, isValidGraveStatus, buildWhereClause } from '@/lib/utils/cemetery';

export async function GET(request: Request) {
  try {
    // Require authentication
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const cemeteryId = searchParams.get('cemeteryId');
    const parcelId = searchParams.get('parcelId');
    const rowId = searchParams.get('rowId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions = [];

    // Validate and add filters
    if (cemeteryId) {
      const uuidValidation = validateUuid(cemeteryId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid cemeteryId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryGraves.cemeteryId, cemeteryId));
    }

    if (parcelId) {
      const uuidValidation = validateUuid(parcelId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid parcelId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryGraves.parcelId, parcelId));
    }

    if (rowId) {
      const uuidValidation = validateUuid(rowId);
      if (!uuidValidation.valid) {
        return NextResponse.json(
          { success: false, error: `Invalid rowId: ${uuidValidation.error}` },
          { status: 400 }
        );
      }
      conditions.push(eq(cemeteryGraves.rowId, rowId));
    }

    if (status && isValidGraveStatus(status)) {
      conditions.push(eq(cemeteryGraves.status, status));
    }

    const whereClause = buildWhereClause(conditions);

    // Query graves with related data
    let query = db
      .select({
        grave: cemeteryGraves,
        cemetery: cemeteries,
        parcel: cemeteryParcels,
        row: cemeteryRows,
      })
      .from(cemeteryGraves)
      .innerJoin(cemeteries, eq(cemeteryGraves.cemeteryId, cemeteries.id))
      .innerJoin(cemeteryParcels, eq(cemeteryGraves.parcelId, cemeteryParcels.id))
      .innerJoin(cemeteryRows, eq(cemeteryGraves.rowId, cemeteryRows.id));

    if (whereClause) {
      query = query.where(whereClause);
    }

    const results = await query;

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        statistics: {
          total: 0,
          free: 0,
          occupied: 0,
          reserved: 0,
          maintenance: 0,
          withConcessions: 0,
          withBurials: 0,
        },
      });
    }

    // Extract grave IDs for batch queries
    const graveIds = results.map(r => r.grave.id);

    // Batch fetch all active concessions for these graves
    const allConcessions = await db
      .select({
        concession: cemeteryConcessions,
        client: clients,
      })
      .from(cemeteryConcessions)
      .leftJoin(clients, eq(cemeteryConcessions.holderClientId, clients.id))
      .where(
        and(
          inArray(cemeteryConcessions.graveId, graveIds),
          eq(cemeteryConcessions.status, 'active')
        )
      );

    // Batch fetch all burials for these graves
    const allBurials = await db
      .select()
      .from(burials)
      .where(inArray(burials.graveId, graveIds));

    // Group concessions and burials by graveId
    const concessionsByGraveId = new Map<string, typeof allConcessions[0]>();
    allConcessions.forEach(concession => {
      if (concession.concession.graveId) {
        // Only keep the first active concession per grave
        if (!concessionsByGraveId.has(concession.concession.graveId)) {
          concessionsByGraveId.set(concession.concession.graveId, concession);
        }
      }
    });

    const burialsByGraveId = new Map<string, typeof allBurials>();
    allBurials.forEach(burial => {
      if (!burialsByGraveId.has(burial.graveId)) {
        burialsByGraveId.set(burial.graveId, []);
      }
      burialsByGraveId.get(burial.graveId)!.push(burial);
    });

    // Build response with batch-fetched data
    const gravesWithDetails = results.map((result) => {
      const grave = result.grave;
      const concession = concessionsByGraveId.get(grave.id);
      const graveBurials = burialsByGraveId.get(grave.id) || [];

      return {
        id: grave.id,
        code: grave.code,
        status: grave.status,
        width: grave.width,
        length: grave.length,
        positionX: grave.positionX,
        positionY: grave.positionY,
        notes: grave.notes,
        cemetery: {
          id: result.cemetery.id,
          name: result.cemetery.name,
          code: result.cemetery.code,
        },
        parcel: {
          id: result.parcel.id,
          name: result.parcel.name,
          code: result.parcel.code,
        },
        row: {
          id: result.row.id,
          name: result.row.name,
          code: result.row.code,
        },
        concession: concession ? {
          id: concession.concession.id,
          contractNumber: concession.concession.contractNumber,
          contractDate: concession.concession.contractDate,
          startDate: concession.concession.startDate,
          expiryDate: concession.concession.expiryDate,
          annualFee: concession.concession.annualFee,
          status: concession.concession.status,
          holder: concession.client ? {
            id: concession.client.id,
            name: concession.client.firstName && concession.client.lastName
              ? `${concession.client.firstName} ${concession.client.lastName}`
              : concession.client.companyName || '',
          } : null,
        } : null,
        burials: graveBurials.map(burial => ({
          id: burial.id,
          deceasedName: burial.deceasedName,
          deceasedDeathDate: burial.deceasedDeathDate,
          burialDate: burial.burialDate,
          burialCertificateNumber: burial.burialCertificateNumber,
        })),
      };
    });

    // Filter by search if provided
    let filteredGraves = gravesWithDetails;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredGraves = gravesWithDetails.filter(grave => {
        return (
          grave.code.toLowerCase().includes(searchLower) ||
          grave.cemetery.name.toLowerCase().includes(searchLower) ||
          grave.parcel.name?.toLowerCase().includes(searchLower) ||
          grave.row.name?.toLowerCase().includes(searchLower) ||
          grave.concession?.contractNumber.toLowerCase().includes(searchLower) ||
          grave.concession?.holder?.name.toLowerCase().includes(searchLower) ||
          grave.burials.some(b => b.deceasedName.toLowerCase().includes(searchLower))
        );
      });
    }

    // Calculate statistics
    const stats = {
      total: filteredGraves.length,
      free: filteredGraves.filter(g => g.status === 'free').length,
      occupied: filteredGraves.filter(g => g.status === 'occupied').length,
      reserved: filteredGraves.filter(g => g.status === 'reserved').length,
      maintenance: filteredGraves.filter(g => g.status === 'maintenance').length,
      withConcessions: filteredGraves.filter(g => g.concession !== null).length,
      withBurials: filteredGraves.filter(g => g.burials.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      data: filteredGraves,
      statistics: stats,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/graves/occupancy', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

