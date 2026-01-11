import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageParticipants, clients } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createParticipantSchema = z.object({
  parishionerId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional().nullable(),
  cnp: z.string().max(13).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  status: z.enum(['registered', 'confirmed', 'paid', 'cancelled', 'waitlisted']).optional().default('registered'),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/participants - Get all participants for a pilgrimage
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

    const participants = await db
      .select()
      .from(pilgrimageParticipants)
      .where(eq(pilgrimageParticipants.pilgrimageId, id));

    return NextResponse.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error('❌ Error fetching participants:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/participants - Create a new participant
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

    const validation = createParticipantSchema.safeParse(body);

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

    // Check if parishioner exists (if provided)
    if (data.parishionerId) {
      const [existingParishioner] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.parishionerId))
        .limit(1);

      if (!existingParishioner) {
        return NextResponse.json(
          { success: false, error: 'Parishioner not found' },
          { status: 400 }
        );
      }
    }

    const [newParticipant] = await db
      .insert(pilgrimageParticipants)
      .values({
        pilgrimageId: id,
        parishionerId: data.parishionerId || null,
        firstName: data.firstName,
        lastName: data.lastName || null,
        cnp: data.cnp || null,
        birthDate: data.birthDate || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        county: data.county || null,
        postalCode: data.postalCode || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
        specialNeeds: data.specialNeeds || null,
        status: data.status || 'registered',
        totalAmount: data.totalAmount || null,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newParticipant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating participant:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

