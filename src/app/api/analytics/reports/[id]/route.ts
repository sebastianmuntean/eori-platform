import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';
import {
  getSavedReport,
  updateSavedReport,
  deleteSavedReport,
} from '@/lib/analytics/report-builder';
import { z } from 'zod';

const updateReportSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  reportType: z
    .enum([
      'user_activity',
      'document_creation',
      'event_statistics',
      'financial_summary',
      'parishioner_growth',
      'custom',
    ])
    .optional(),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']).optional(),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  parishId: z.string().uuid().optional().nullable(),
  dioceseId: z.string().uuid().optional().nullable(),
  config: z
    .object({
      metrics: z.array(z.string()),
      chartOptions: z
        .object({
          showLegend: z.boolean().optional(),
          showGrid: z.boolean().optional(),
          colors: z.array(z.string()).optional(),
        })
        .optional(),
      aggregation: z.enum(['daily', 'weekly', 'monthly']).optional(),
    })
    .optional(),
  isPublic: z.boolean().optional(),
  sharedWith: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/analytics/reports/[id] - Get a single saved report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const report = await getSavedReport(id, userId);

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logError('Failed to fetch saved report', error);
    return formatErrorResponse(error, 'Failed to fetch saved report');
  }
}

/**
 * PUT /api/analytics/reports/[id] - Update a saved report
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const report = await updateSavedReport(id, userId, validation.data);

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error: any) {
    if (error.message === 'Report not found or access denied') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    logError('Failed to update saved report', error);
    return formatErrorResponse(error, 'Failed to update saved report');
  }
}

/**
 * DELETE /api/analytics/reports/[id] - Delete a saved report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deleteSavedReport(id, userId);

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Report not found or access denied') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    logError('Failed to delete saved report', error);
    return formatErrorResponse(error, 'Failed to delete saved report');
  }
}

