import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentNumberCounters } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const generateNumberSchema = z.object({
  parishId: z.string().uuid('Invalid parish ID'),
  documentType: z.enum(['incoming', 'outgoing', 'internal']),
  year: z.number().int().min(2000).max(2100).optional(),
});

/**
 * POST /api/registratura/number/generate - Generate document registration number
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/registratura/number/generate - Generating document number');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = generateNumberSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const year = data.year || new Date().getFullYear();

    // Try to get existing counter
    const [existingCounter] = await db
      .select()
      .from(documentNumberCounters)
      .where(
        and(
          eq(documentNumberCounters.parishId, data.parishId),
          eq(documentNumberCounters.year, year),
          eq(documentNumberCounters.documentType, data.documentType)
        )
      )
      .limit(1);

    let nextNumber: number;
    let formattedNumber: string;

    if (existingCounter) {
      // Increment existing counter
      nextNumber = existingCounter.currentValue + 1;
      await db
        .update(documentNumberCounters)
        .set({
          currentValue: nextNumber,
          updatedAt: new Date(),
        })
        .where(eq(documentNumberCounters.id, existingCounter.id));
    } else {
      // Create new counter starting at 1
      nextNumber = 1;
      await db.insert(documentNumberCounters).values({
        parishId: data.parishId,
        year,
        documentType: data.documentType,
        currentValue: nextNumber,
      });
    }

    formattedNumber = `${nextNumber}/${year}`;

    console.log(`✓ Generated document number: ${formattedNumber}`);
    return NextResponse.json({
      success: true,
      data: {
        registrationNumber: nextNumber,
        formattedNumber,
        year,
      },
    });
  } catch (error) {
    console.error('❌ Error generating document number:', error);
    logError(error, { endpoint: '/api/registratura/number/generate', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




