import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents, churchEventParticipants } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { funeralFormSchema } from '@/lib/validations/public-event-forms';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(10, 60000)(request); // 10 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = funeralFormSchema.safeParse(body);

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
        type: 'funeral',
        status: data.isUrgent ? 'pending' : 'pending', // Could prioritize urgent funerals
        eventDate: data.eventDate || null,
        location: data.location || null,
        notes: data.notes || null,
      })
      .returning();

    // Create participants
    const participants = [];

    // Deceased
    if (data.deceased) {
      participants.push({
        eventId: newEvent.id,
        role: 'deceased',
        firstName: data.deceased.firstName,
        lastName: data.deceased.lastName || null,
        birthDate: data.deceased.birthDate || null,
        cnp: data.deceased.cnp || null,
        address: data.deceased.address || null,
        city: data.deceased.city || null,
        phone: data.deceased.phone || null,
        email: data.deceased.email || null,
      });
    }

    // Family members
    if (data.familyMembers && data.familyMembers.length > 0) {
      for (const member of data.familyMembers) {
        participants.push({
          eventId: newEvent.id,
          role: 'other',
          firstName: member.firstName,
          lastName: member.lastName || null,
          birthDate: member.birthDate || null,
          cnp: member.cnp || null,
          address: member.address || null,
          city: member.city || null,
          phone: member.phone || null,
          email: member.email || null,
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
          message: 'Funeral request submitted successfully. You will be contacted soon.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/public/events/funerals', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

