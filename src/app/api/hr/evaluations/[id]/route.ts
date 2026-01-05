import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { evaluations } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { sendEvaluationCompletionNotification } from '@/lib/services/hr-notifications';

const updateEvaluationSchema = z.object({
  employeeId: z.string().uuid().optional(),
  evaluatorId: z.string().uuid().optional(),
  evaluationPeriodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  evaluationPeriodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  evaluationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  overallScore: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  overallComment: z.string().optional().nullable(),
  strengths: z.string().optional().nullable(),
  improvementAreas: z.string().optional().nullable(),
  status: z.enum(['draft', 'completed', 'acknowledged']).optional(),
});

export async function GET(
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

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validation = updateEvaluationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    
    // Get current evaluation to check status change
    const [currentEvaluation] = await db
      .select({ status: evaluations.status })
      .from(evaluations)
      .where(eq(evaluations.id, id))
      .limit(1);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.evaluatorId !== undefined) updateData.evaluatorId = data.evaluatorId;
    if (data.evaluationPeriodStart !== undefined) updateData.evaluationPeriodStart = data.evaluationPeriodStart;
    if (data.evaluationPeriodEnd !== undefined) updateData.evaluationPeriodEnd = data.evaluationPeriodEnd;
    if (data.evaluationDate !== undefined) updateData.evaluationDate = data.evaluationDate;
    if (data.overallScore !== undefined) updateData.overallScore = data.overallScore;
    if (data.overallComment !== undefined) updateData.overallComment = data.overallComment;
    if (data.strengths !== undefined) updateData.strengths = data.strengths;
    if (data.improvementAreas !== undefined) updateData.improvementAreas = data.improvementAreas;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedEvaluation] = await db
      .update(evaluations)
      .set(updateData)
      .where(eq(evaluations.id, id))
      .returning();

    if (!updatedEvaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    // Send notification if status changed to 'completed'
    if (data.status === 'completed' && currentEvaluation?.status !== 'completed') {
      sendEvaluationCompletionNotification(id).catch((error) => {
        console.error('Failed to send evaluation completion notification:', error);
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedEvaluation,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [deletedEvaluation] = await db
      .delete(evaluations)
      .where(eq(evaluations.id, id))
      .returning();

    if (!deletedEvaluation) {
      return NextResponse.json(
        { success: false, error: 'Evaluation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedEvaluation,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluations/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


