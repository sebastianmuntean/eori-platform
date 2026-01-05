import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents, churchEventParticipants } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { weddingFormSchema } from '@/lib/validations/public-event-forms';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(10, 60000)(request); // 10 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = weddingFormSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Create the event
    const [newEvent] = await db
      .insert(churchEvents)
      .values({
        parishId: data.parishId,
        type: 'wedding',
        status: 'pending',
        eventDate: data.eventDate || null,
        location: data.location || null,
        notes: data.notes || null,
      })
      .returning();

    // Create participants
    const participants = [];

    // Groom
    if (data.groom) {
      participants.push({
        eventId: newEvent.id,
        role: 'groom',
        firstName: data.groom.firstName,
        lastName: data.groom.lastName || null,
        birthDate: data.groom.birthDate || null,
        cnp: data.groom.cnp || null,
        address: data.groom.address || null,
        city: data.groom.city || null,
        phone: data.groom.phone || null,
        email: data.groom.email || null,
      });
    }

    // Bride
    if (data.bride) {
      participants.push({
        eventId: newEvent.id,
        role: 'bride',
        firstName: data.bride.firstName,
        lastName: data.bride.lastName || null,
        birthDate: data.bride.birthDate || null,
        cnp: data.bride.cnp || null,
        address: data.bride.address || null,
        city: data.bride.city || null,
        phone: data.bride.phone || null,
        email: data.bride.email || null,
      });
    }

    // Groom parents
    if (data.groomParents?.father) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.groomParents.father.firstName,
        lastName: data.groomParents.father.lastName || null,
        birthDate: data.groomParents.father.birthDate || null,
        cnp: data.groomParents.father.cnp || null,
        address: data.groomParents.father.address || null,
        city: data.groomParents.father.city || null,
        phone: data.groomParents.father.phone || null,
        email: data.groomParents.father.email || null,
        notes: 'Groom\'s father',
      });
    }

    if (data.groomParents?.mother) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.groomParents.mother.firstName,
        lastName: data.groomParents.mother.lastName || null,
        birthDate: data.groomParents.mother.birthDate || null,
        cnp: data.groomParents.mother.cnp || null,
        address: data.groomParents.mother.address || null,
        city: data.groomParents.mother.city || null,
        phone: data.groomParents.mother.phone || null,
        email: data.groomParents.mother.email || null,
        notes: 'Groom\'s mother',
      });
    }

    // Bride parents
    if (data.brideParents?.father) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.brideParents.father.firstName,
        lastName: data.brideParents.father.lastName || null,
        birthDate: data.brideParents.father.birthDate || null,
        cnp: data.brideParents.father.cnp || null,
        address: data.brideParents.father.address || null,
        city: data.brideParents.father.city || null,
        phone: data.brideParents.father.phone || null,
        email: data.brideParents.father.email || null,
        notes: 'Bride\'s father',
      });
    }

    if (data.brideParents?.mother) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.brideParents.mother.firstName,
        lastName: data.brideParents.mother.lastName || null,
        birthDate: data.brideParents.mother.birthDate || null,
        cnp: data.brideParents.mother.cnp || null,
        address: data.brideParents.mother.address || null,
        city: data.brideParents.mother.city || null,
        phone: data.brideParents.mother.phone || null,
        email: data.brideParents.mother.email || null,
        notes: 'Bride\'s mother',
      });
    }

    // Witnesses
    if (data.witnesses && data.witnesses.length > 0) {
      for (const witness of data.witnesses) {
        participants.push({
          eventId: newEvent.id,
          role: 'witness',
          firstName: witness.firstName,
          lastName: witness.lastName || null,
          birthDate: witness.birthDate || null,
          cnp: witness.cnp || null,
          address: witness.address || null,
          city: witness.city || null,
          phone: witness.phone || null,
          email: witness.email || null,
        });
      }
    }

    // Contact person
    participants.push({
      eventId: newEvent.id,
      role: 'other',
      firstName: data.contactName,
      phone: data.contactPhone,
      email: data.contactEmail || null,
      notes: 'Contact person',
    });

    // Insert all participants
    if (participants.length > 0) {
      await db.insert(churchEventParticipants).values(participants);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          eventId: newEvent.id,
          message: 'Wedding request submitted successfully. You will be contacted soon.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/public/events/weddings', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}





