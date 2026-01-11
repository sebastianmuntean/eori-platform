import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageTransport } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createTransportSchema = z.object({
  transportType: z.enum(['bus', 'train', 'plane', 'car', 'other']),
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
 * GET /api/pilgrimages/[id]/transport - Get all transport for a pilgrimage
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

    const transport = await db
      .select()
      .from(pilgrimageTransport)
      .where(eq(pilgrimageTransport.pilgrimageId, id));

    return NextResponse.json({
      success: true,
      data: transport,
    });
  } catch (error) {
    console.error('❌ Error fetching transport:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/transport', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/transport - Create a new transport entry
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
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

    const validation = createTransportSchema.safeParse(body);

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

    const [newTransport] = await db
      .insert(pilgrimageTransport)
      .values({
        pilgrimageId: id,
        transportType: data.transportType as any,
        departureLocation: data.departureLocation || null,
        departureDate: data.departureDate || null,
        departureTime: data.departureTime || null,
        arrivalLocation: data.arrivalLocation || null,
        arrivalDate: data.arrivalDate || null,
        arrivalTime: data.arrivalTime || null,
        providerName: data.providerName || null,
        providerContact: data.providerContact || null,
        vehicleDetails: data.vehicleDetails || null,
        capacity: data.capacity || null,
        pricePerPerson: data.pricePerPerson || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newTransport,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating transport:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/transport', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

