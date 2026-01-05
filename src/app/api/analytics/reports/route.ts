import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';
import {
  createSavedReport,
  getSavedReports,
  SavedReport,
  ReportConfig,
} from '@/lib/analytics/report-builder';
import { z } from 'zod';

const createReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  reportType: z.enum([
    'user_activity',
    'document_creation',
    'event_statistics',
    'financial_summary',
    'parishioner_growth',
    'custom',
  ]),
  chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter']),
  dateRange: z
    .object({
      start: z.string(),
      end: z.string(),
    })
    .optional(),
  parishId: z.string().uuid().optional(),
  dioceseId: z.string().uuid().optional(),
  config: z.object({
    metrics: z.array(z.string()),
    chartOptions: z
      .object({
        showLegend: z.boolean().optional(),
        showGrid: z.boolean().optional(),
        colors: z.array(z.string()).optional(),
      })
      .optional(),
    aggregation: z.enum(['daily', 'weekly', 'monthly']).optional(),
  }),
  isPublic: z.boolean().optional().default(false),
  sharedWith: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/analytics/reports - Get all saved reports for the current user
 */
export async function GET() {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const reports = await getSavedReports(userId);

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    logError('Failed to fetch saved reports', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}

/**
 * POST /api/analytics/reports - Create a new saved report
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createReportSchema.safeParse(body);

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

    const reportData = validation.data;
    const report = await createSavedReport(userId, {
      name: reportData.name,
      description: reportData.description,
      reportType: reportData.reportType,
      chartType: reportData.chartType,
      dateRange: reportData.dateRange,
      parishId: reportData.parishId,
      dioceseId: reportData.dioceseId,
      config: reportData.config,
      isPublic: reportData.isPublic,
      sharedWith: reportData.sharedWith,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logError('Failed to create saved report', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}



