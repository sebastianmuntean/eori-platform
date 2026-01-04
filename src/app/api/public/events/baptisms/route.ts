import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents, churchEventParticipants } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { rateLimit } from '@/lib/rate-limit';
import { baptismFormSchema } from '@/lib/validations/public-event-forms';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for public endpoint
    const rateLimitResponse = rateLimit(10, 60000)(request); // 10 requests per minute
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const validation = baptismFormSchema.safeParse(body);

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
        type: 'baptism',
        status: 'pending',
        eventDate: data.eventDate || null,
        notes: data.notes || null,
      })
      .returning();

    // Create participants
    const participants = [];

    // Baptized child
    if (data.baptized) {
      participants.push({
        eventId: newEvent.id,
        role: 'baptized',
        firstName: data.baptized.firstName,
        lastName: data.baptized.lastName || null,
        birthDate: data.baptized.birthDate || null,
        cnp: data.baptized.cnp || null,
        address: data.baptized.address || null,
        city: data.baptized.city || null,
        phone: data.baptized.phone || null,
        email: data.baptized.email || null,
      });
    }

    // Parents
    if (data.parents?.father) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.parents.father.firstName,
        lastName: data.parents.father.lastName || null,
        birthDate: data.parents.father.birthDate || null,
        cnp: data.parents.father.cnp || null,
        address: data.parents.father.address || null,
        city: data.parents.father.city || null,
        phone: data.parents.father.phone || null,
        email: data.parents.father.email || null,
        notes: 'Father',
      });
    }

    if (data.parents?.mother) {
      participants.push({
        eventId: newEvent.id,
        role: 'parent',
        firstName: data.parents.mother.firstName,
        lastName: data.parents.mother.lastName || null,
        birthDate: data.parents.mother.birthDate || null,
        cnp: data.parents.mother.cnp || null,
        address: data.parents.mother.address || null,
        city: data.parents.mother.city || null,
        phone: data.parents.mother.phone || null,
        email: data.parents.mother.email || null,
        notes: 'Mother',
      });
    }

    // Godparents
    if (data.godparents && data.godparents.length > 0) {
      for (const godparent of data.godparents) {
        participants.push({
          eventId: newEvent.id,
          role: 'godparent',
          firstName: godparent.firstName,
          lastName: godparent.lastName || null,
          birthDate: godparent.birthDate || null,
          cnp: godparent.cnp || null,
          address: godparent.address || null,
          city: godparent.city || null,
          phone: godparent.phone || null,
          email: godparent.email || null,
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
          message: 'Baptism request submitted successfully. You will be contacted soon.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logError(error, { endpoint: '/api/public/events/baptisms', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



