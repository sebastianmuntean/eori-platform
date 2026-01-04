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
 * Error type classification for better error handling
 */
enum ErrorType {
  DATABASE_TABLE_NOT_FOUND = 'DATABASE_TABLE_NOT_FOUND',
  DATABASE_CONNECTION = 'DATABASE_CONNECTION',
  DATABASE_OPERATION = 'DATABASE_OPERATION',
  GENERIC = 'GENERIC',
}

/**
 * Safely extracts error message from unknown error type
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return String(error);
}

/**
 * Classifies error type based on error message patterns
 */
function classifyErrorType(errorMessage: string): ErrorType {
  const lowerMessage = errorMessage.toLowerCase();

  // Database table/relation errors
  if (
    lowerMessage.includes('does not exist') ||
    lowerMessage.includes('relation') ||
    lowerMessage.includes('failed query') ||
    (lowerMessage.includes('column') && lowerMessage.includes('does not exist'))
  ) {
    return ErrorType.DATABASE_TABLE_NOT_FOUND;
  }

  // Database connection errors
  if (
    lowerMessage.includes('connection') ||
    lowerMessage.includes('connect econnrefused') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('connection refused')
  ) {
    return ErrorType.DATABASE_CONNECTION;
  }

  // Other database operation errors
  if (
    lowerMessage.includes('syntax error') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('duplicate key') ||
    lowerMessage.includes('violates') ||
    lowerMessage.includes('constraint')
  ) {
    return ErrorType.DATABASE_OPERATION;
  }

  return ErrorType.GENERIC;
}

/**
 * Formats error message based on error type and environment
 */
function formatErrorMessage(
  errorType: ErrorType,
  originalMessage: string
): string {
  const isProduction = process.env.NODE_ENV === 'production';

  switch (errorType) {
    case ErrorType.DATABASE_TABLE_NOT_FOUND:
      return isProduction
        ? 'Database table not found. Please ensure migrations have been run.'
        : `Database error: ${originalMessage}. This usually means the table or column doesn't exist. Please run database migrations.`;

    case ErrorType.DATABASE_CONNECTION:
      return isProduction
        ? 'Database connection failed'
        : `Database connection error: ${originalMessage}. Please check your DATABASE_URL.`;

    case ErrorType.DATABASE_OPERATION:
      return isProduction
        ? 'Database operation failed'
        : originalMessage;

    case ErrorType.GENERIC:
    default:
      return isProduction
        ? 'An error occurred'
        : originalMessage;
  }
}

/**
 * Gets appropriate HTTP status code for error type
 */
function getErrorStatusCode(errorType: ErrorType): number {
  switch (errorType) {
    case ErrorType.DATABASE_CONNECTION:
      return 503; // Service Unavailable
    case ErrorType.DATABASE_TABLE_NOT_FOUND:
    case ErrorType.DATABASE_OPERATION:
    case ErrorType.GENERIC:
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Format error response (secure - don't expose stack traces or sensitive info)
 * 
 * This function safely formats errors for API responses, ensuring that:
 * - Sensitive information is not exposed in production
 * - Error types are properly classified
 * - Appropriate HTTP status codes are returned
 */
export function formatErrorResponse(error: unknown): {
  success: false;
  error: string;
  statusCode: number;
} {
  console.log('Step 1: Formatting error response');

  // Handle known AppError instances
  if (error instanceof AppError) {
    console.log(`✓ Error formatted: ${error.message} (${error.statusCode})`);
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    // Log full error for debugging, but don't expose to client
    console.error('❌ Unexpected error:', error);
    if (error.stack) {
      console.error('❌ Error stack:', error.stack);
    }

    const errorMessage = getErrorMessage(error);
    const errorType = classifyErrorType(errorMessage);
    const formattedMessage = formatErrorMessage(errorType, errorMessage);
    const statusCode = getErrorStatusCode(errorType);

    return {
      success: false,
      error: formattedMessage,
      statusCode,
    };
  }

  // Handle unknown error types
  console.error('❌ Unknown error type:', error);
  const errorMessage = getErrorMessage(error);
  return {
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : `An unexpected error occurred: ${errorMessage}`,
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

  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
    try {
      // Dynamic import to avoid loading Sentry in development
      const { captureException } = require('./monitoring/sentry');
      const errorToCapture = error instanceof Error ? error : new Error(String(error));
      captureException(errorToCapture, context);
    } catch (sentryError) {
      // Silently fail if Sentry is not available
      console.warn('Failed to send error to Sentry:', sentryError);
    }
  }
}




