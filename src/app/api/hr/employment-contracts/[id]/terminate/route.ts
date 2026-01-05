import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const terminateContractSchema = z.object({
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  terminationReason: z.string().optional().nullable(),
});

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

    const body = await request.json();
    const validation = terminateContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [contract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    const [updatedContract] = await db
      .update(employmentContracts)
      .set({
        status: 'terminated',
        terminationDate: data.terminationDate,
        terminationReason: data.terminationReason || null,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(employmentContracts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employment-contracts/[id]/terminate', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



