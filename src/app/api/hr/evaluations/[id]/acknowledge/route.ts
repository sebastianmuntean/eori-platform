import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { evaluations } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.id, id))
      .limit(1);

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    const [updatedEvaluation] = await db
      .update(evaluations)
      .set({
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(evaluations.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedEvaluation,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations/[id]/acknowledge', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







