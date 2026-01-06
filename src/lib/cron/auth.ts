import { NextResponse } from 'next/server';
import { AuthenticationError } from '@/lib/errors';

/**
 * Validates cron request authentication using CRON_SECRET
 * @param request - The incoming request
 * @throws {AuthenticationError} if authentication fails
 */
export function validateCronAuth(request: Request): void {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log('❌ Unauthorized cron request');
    throw new AuthenticationError('Unauthorized');
  }
}

/**
 * Middleware wrapper for cron endpoints that validates authentication
 * @param handler - The route handler function
 * @returns A wrapped handler that validates cron authentication
 */
export function withCronAuth<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as Request;
    try {
      validateCronAuth(request);
      return await handler(...args);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }
      throw error;
    }
  }) as T;
}







