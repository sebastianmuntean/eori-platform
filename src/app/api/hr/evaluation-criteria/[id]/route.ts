import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { evaluationCriteria } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEvaluationCriterionSchema = z.object({
  parishId: z.string().uuid().optional().nullable(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  maxScore: z.number().int().min(0).optional(),
  weight: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [criterion] = await db
      .select()
      .from(evaluationCriteria)
      .where(eq(evaluationCriteria.id, id))
      .limit(1);

    if (!criterion) {
      return NextResponse.json(
        { success: false, error: 'Evaluation criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: criterion,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluation-criteria/[id]', method: 'GET' });
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
    const validation = updateEvaluationCriterionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = { updatedAt: new Date() };

    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedCriterion] = await db
      .update(evaluationCriteria)
      .set(updateData)
      .where(eq(evaluationCriteria.id, id))
      .returning();

    if (!updatedCriterion) {
      return NextResponse.json(
        { success: false, error: 'Evaluation criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCriterion,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluation-criteria/[id]', method: 'PUT' });
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
    const [deletedCriterion] = await db
      .delete(evaluationCriteria)
      .where(eq(evaluationCriteria.id, id))
      .returning();

    if (!deletedCriterion) {
      return NextResponse.json(
        { success: false, error: 'Evaluation criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedCriterion,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/evaluation-criteria/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



