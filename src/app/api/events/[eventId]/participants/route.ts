import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventParticipants, churchEvents, parishioners } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getEventById } from '@/lib/services/events-service';

// Consistent role enum for both create and update
const participantRoleEnum = z.enum(['bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'family_member', 'other']);

const createParticipantSchema = z.object({
  parishionerId: z.string().uuid().optional().nullable(),
  role: participantRoleEnum,
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().max(255).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  cnp: z.string().max(13).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/events/[eventId]/participants - Get all participants for an event
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: GET /api/events/${eventId}/participants - Fetching participants`);

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view events
    const hasPermission = await checkPermission('events.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    const participants = await db
      .select()
      .from(churchEventParticipants)
      .where(eq(churchEventParticipants.eventId, eventId));

    console.log(`✓ Found ${participants.length} participants`);
    return NextResponse.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error('❌ Error fetching participants:', error);
    logError(error, { endpoint: '/api/events/[eventId]/participants', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/events/[eventId]/participants - Create a new participant
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: POST /api/events/${eventId}/participants - Creating participant`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to update events
    const hasPermission = await checkPermission('events.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    const body = await request.json();
    const validation = createParticipantSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parishioner exists (if provided)
    if (data.parishionerId) {
      console.log(`Step 2: Checking if parishioner ${data.parishionerId} exists`);
      const [existingParishioner] = await db
        .select()
        .from(parishioners)
        .where(eq(parishioners.id, data.parishionerId))
        .limit(1);

      if (!existingParishioner) {
        console.log(`❌ Parishioner ${data.parishionerId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parishioner not found' },
          { status: 400 }
        );
      }
    }

    // Create participant
    console.log('Step 3: Creating participant');
    const [newParticipant] = await db
      .insert(churchEventParticipants)
      .values({
        eventId,
        parishionerId: data.parishionerId || null,
        role: data.role === 'family_member' ? 'other' : data.role,
        firstName: data.firstName,
        lastName: data.lastName || null,
        birthDate: data.birthDate || null,
        cnp: data.cnp || null,
        address: data.address || null,
        city: data.city || null,
        phone: data.phone || null,
        email: data.email || null,
        notes: data.notes || null,
      })
      .returning();

    console.log(`✓ Participant created successfully: ${newParticipant.id}`);
    return NextResponse.json(
      {
        success: true,
        data: newParticipant,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating participant:', error);
    logError(error, { endpoint: '/api/events/[eventId]/participants', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

