import { validateCronAuth, createCronSuccessResponse, createCronErrorResponse, createHealthCheckResponse } from '@/lib/cron';
import { formatErrorResponse, logError } from '@/lib/errors';
import { fetchAndProcessEmails } from '@/lib/services/email-fetcher';

/**
 * POST /api/cron/email-fetcher - Cron endpoint for fetching and processing emails
 * 
 * This endpoint should be called periodically (e.g., every 15-30 minutes) by a cron job
 * or scheduled task service (like Vercel Cron, GitHub Actions, etc.)
 * 
 * Security: Protected with CRON_SECRET
 */
export async function POST(request: Request) {
  console.log('Step 1: Email fetcher cron job triggered');

  try {
    validateCronAuth(request);
  } catch (error) {
    return createCronErrorResponse(error, 401);
  }

  try {
    const stats = await fetchAndProcessEmails();

    return createCronSuccessResponse({
      processed: stats.processed,
      created: stats.created,
      errors: stats.errors,
    });
  } catch (error) {
    console.error('❌ Error in email fetcher cron:', error);
    logError(error, { endpoint: '/api/cron/email-fetcher', method: 'POST' });
    const errorResponse = formatErrorResponse(error);
    return createCronErrorResponse(error, errorResponse.statusCode);
  }
}

/**
 * GET /api/cron/email-fetcher - Health check endpoint
 */
export async function GET() {
  return createHealthCheckResponse('Email fetcher');
}
