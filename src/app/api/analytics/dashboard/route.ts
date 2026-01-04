import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getDashboardMetrics, AnalyticsFilters } from '@/lib/analytics/analytics-service';

/**
 * GET /api/analytics/dashboard - Get dashboard analytics data
 * 
 * Query parameters:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - parishId: UUID (optional)
 * - dioceseId: UUID (optional)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const parishId = searchParams.get('parishId');
    const dioceseId = searchParams.get('dioceseId');

    const filters: AnalyticsFilters = {};

    if (startDate && endDate) {
      filters.dateRange = {
        start: startDate,
        end: endDate,
      };
    }

    if (parishId) {
      filters.parishId = parishId;
    }

    if (dioceseId) {
      filters.dioceseId = dioceseId;
    }

    const metrics = await getDashboardMetrics(filters);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logError('Failed to fetch dashboard analytics', error);
    return formatErrorResponse(error, 'Failed to fetch dashboard analytics');
  }
}

