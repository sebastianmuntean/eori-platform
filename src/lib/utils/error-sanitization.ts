/**
 * Error message sanitization utilities
 * Prevents information leakage by sanitizing technical error messages
 */

/**
 * Sanitizes error messages to prevent information leakage
 * Maps technical errors to user-friendly messages
 * 
 * @param error - The error message to sanitize
 * @returns A user-friendly error message
 */
export function sanitizeErrorMessage(error: string | null | undefined): string {
  if (!error) {
    return 'An error occurred. Please try again.';
  }

  const errorLower = error.toLowerCase();

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('econnrefused')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Authentication errors
  if (errorLower.includes('401') || errorLower.includes('unauthorized') || errorLower.includes('not authenticated')) {
    return 'Authentication required. Please log in again.';
  }

  // Authorization errors
  if (errorLower.includes('403') || errorLower.includes('forbidden') || errorLower.includes('permission')) {
    return 'You do not have permission to perform this action.';
  }

  // Not found errors
  if (errorLower.includes('404') || errorLower.includes('not found')) {
    return 'The requested resource was not found.';
  }

  // Server errors
  if (errorLower.includes('500') || errorLower.includes('internal server error')) {
    return 'Server error. Please try again later.';
  }

  // Timeout errors
  if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
    return 'Request timed out. Please try again.';
  }

  // HTTP status code patterns (catch generic HTTP errors)
  if (/http error! status: \d+/.test(errorLower)) {
    return 'An error occurred. Please try again.';
  }

  // Database errors (should not be exposed to users)
  if (errorLower.includes('database') || errorLower.includes('sql') || errorLower.includes('query')) {
    return 'An error occurred. Please try again.';
  }

  // Validation errors (these are usually safe to show)
  if (errorLower.includes('validation') || errorLower.includes('invalid') || errorLower.includes('required')) {
    // Return as-is for validation errors (they're user-facing)
    return error;
  }

  // For other errors, return generic message to avoid info leakage
  return 'An error occurred. Please try again.';
}

/**
 * Conditionally logs errors based on environment
 * In production, errors should be sent to error tracking service instead of console
 * 
 * @param message - Error message
 * @param error - Error object or additional context
 */
export function logError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // For now, minimal logging (remove in production or integrate with error tracking)
    // console.error(message);
  }
}


