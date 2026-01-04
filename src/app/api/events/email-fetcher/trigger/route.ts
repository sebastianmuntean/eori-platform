import { NextResponse } from 'next/server';
import { fetchAndProcessEmails } from '@/lib/services/email-fetcher';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';

/**
 * POST /api/events/email-fetcher/trigger - Manually trigger email fetcher (authenticated endpoint)
 */
export async function POST(request: Request) {
  console.log('Step 1: POST /api/events/email-fetcher/trigger - Manually triggering email fetcher');

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`Step 2: User ${userId} triggered email fetcher`);
    const stats = await fetchAndProcessEmails();

    console.log(`✓ Email fetcher completed: ${stats.processed} processed, ${stats.created} created, ${stats.errors} errors`);

    return NextResponse.json({
      success: true,
      data: {
        processed: stats.processed,
        created: stats.created,
        errors: stats.errors,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error in email fetcher trigger:', error);
    logError(error, { endpoint: '/api/events/email-fetcher/trigger', method: 'POST' });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}



