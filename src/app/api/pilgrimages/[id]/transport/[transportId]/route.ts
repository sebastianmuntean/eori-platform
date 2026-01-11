import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageTransport } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updateTransportSchema = z.object({
  transportType: z.enum(['bus', 'train', 'plane', 'car', 'other']).optional(),
  departureLocation: z.string().max(255).optional().nullable(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  arrivalLocation: z.string().max(255).optional().nullable(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  providerName: z.string().max(255).optional().nullable(),
  providerContact: z.string().max(255).optional().nullable(),
  vehicleDetails: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  pricePerPerson: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/transport/[transportId] - Get transport by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; transportId: string }> }
) {
  const { id, transportId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(transportId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
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

    const [transport] = await db
      .select()
      .from(pilgrimageTransport)
      .where(
        and(
          eq(pilgrimageTransport.id, transportId),
          eq(pilgrimageTransport.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!transport) {
      return NextResponse.json(
        { success: false, error: 'Transport not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transport,
    });
  } catch (error) {
    console.error('❌ Error fetching transport:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/transport/[transportId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/transport/[transportId] - Update transport
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; transportId: string }> }
) {
  const { id, transportId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(transportId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = updateTransportSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [existingTransport] = await db
      .select()
      .from(pilgrimageTransport)
      .where(
        and(
          eq(pilgrimageTransport.id, transportId),
          eq(pilgrimageTransport.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingTransport) {
      return NextResponse.json(
        { success: false, error: 'Transport not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedTransport] = await db
      .update(pilgrimageTransport)
      .set(updateData)
      .where(eq(pilgrimageTransport.id, transportId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedTransport,
    });
  } catch (error) {
    console.error('❌ Error updating transport:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/transport/[transportId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/transport/[transportId] - Delete transport
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; transportId: string }> }
) {
  const { id, transportId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(transportId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const [deletedTransport] = await db
      .delete(pilgrimageTransport)
      .where(
        and(
          eq(pilgrimageTransport.id, transportId),
          eq(pilgrimageTransport.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedTransport) {
      return NextResponse.json(
        { success: false, error: 'Transport not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedTransport,
    });
  } catch (error) {
    console.error('❌ Error deleting transport:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/transport/[transportId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

