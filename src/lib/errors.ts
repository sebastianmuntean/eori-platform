/**
 * Secure error handling - don't expose sensitive information
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not found') {
    super(message, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Format error response (secure - don't expose stack traces or sensitive info)
 */
export function formatErrorResponse(error: unknown): {
  success: false;
  error: string;
  statusCode: number;
} {
  console.log('Step 1: Formatting error response');

  if (error instanceof AppError) {
    console.log(`✓ Error formatted: ${error.message} (${error.statusCode})`);
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Log full error for debugging, but don't expose to client
    console.error('❌ Unexpected error:', error);

    // In production, return generic error
    // In development, you might want to return more details
    const message =
      process.env.NODE_ENV === 'production'
        ? 'An error occurred'
        : error.message;

    return {
      success: false,
      error: message,
      statusCode: 500,
    };
  }

  // Unknown error type
  console.error('❌ Unknown error type:', error);
  return {
    success: false,
    error: 'An unexpected error occurred',
    statusCode: 500,
  };
}

/**
 * Safe error logger (log to service like Sentry in production)
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  console.error('❌ Error logged:', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
  });

  // TODO: Send to error tracking service (Sentry, etc.) in production
}




