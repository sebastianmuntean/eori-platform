import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';
import { generateReportData } from '@/lib/analytics/report-builder';

/**
 * GET /api/analytics/reports/[id]/generate - Generate report data
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
    const reportData = await generateReportData(id, userId);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error: any) {
    if (error.message === 'Report not found or access denied') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }
    logError('Failed to generate report data', error);
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



