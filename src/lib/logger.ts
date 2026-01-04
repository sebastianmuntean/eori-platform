/**
 * Secure logging utility
 * Prevents sensitive data exposure in logs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  endpoint?: string;
  method?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Hash identifier for privacy (simple hash for logging)
 */
function hashIdentifier(identifier: string): string {
  // Simple hash function for logging purposes
  // In production, consider using crypto.createHash
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

/**
 * Redact sensitive data from log context
 */
function redactSensitiveData(context: LogContext): LogContext {
  const redacted = { ...context };
  
  // Remove or hash sensitive fields
  if (redacted.email) {
    redacted.email = hashIdentifier(redacted.email);
  }
  if (redacted.token) {
    redacted.token = redacted.token.substring(0, 8) + '...';
  }
  if (redacted.password) {
    redacted.password = '[REDACTED]';
  }
  
  return redacted;
}

/**
 * Check if debug logging is enabled
 */
function isDebugEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && 
         (process.env.LOG_LEVEL === 'debug' || !process.env.LOG_LEVEL);
}

/**
 * Log message with appropriate level
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  const shouldLog = 
    level === 'error' || 
    level === 'warn' ||
    isDebugEnabled();

  if (!shouldLog) {
    return;
  }

  const redactedContext = context ? redactSensitiveData(context) : undefined;
  const logEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redactedContext,
  };

  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'info':
      console.log(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (isDebugEnabled()) {
        console.log(JSON.stringify(logEntry));
      }
      break;
  }
}

/**
 * Log authentication attempt (without sensitive data)
 */
export function logAuthAttempt(identifier: string, success: boolean, context?: LogContext): void {
  const hashedId = hashIdentifier(identifier);
  log(success ? 'info' : 'warn', 'auth_attempt', {
    identifier: hashedId,
    success,
    ...context,
  });
}

/**
 * Log API request
 */
export function logRequest(endpoint: string, method: string, context?: LogContext): void {
  log('debug', 'api_request', {
    endpoint,
    method,
    ...context,
  });

  // Add Sentry breadcrumb for request tracking
  if (process.env.NODE_ENV === 'production') {
    try {
      const { addBreadcrumb } = require('./monitoring/sentry');
      addBreadcrumb({
        category: 'http',
        message: `${method} ${endpoint}`,
        level: 'info',
        data: {
          endpoint,
          method,
          ...(context?.userId && { userId: context.userId }),
        },
      });
    } catch {
      // Silently fail if Sentry is not available
    }
  }
}

/**
 * Log API response
 */
export function logResponse(endpoint: string, method: string, statusCode: number, context?: LogContext): void {
  log('debug', 'api_response', {
    endpoint,
    method,
    statusCode,
    ...context,
  });
}

/**
 * Log error
 */
export function logError(message: string, error: unknown, context?: LogContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  log('error', message, {
    error: errorMessage,
    stack: errorStack,
    ...context,
  });

  // Add Sentry breadcrumb for error tracking
  if (process.env.NODE_ENV === 'production') {
    try {
      const { addBreadcrumb } = require('./monitoring/sentry');
      addBreadcrumb({
        category: 'error',
        message,
        level: 'error',
        data: {
          error: errorMessage,
          ...context,
        },
      });
    } catch {
      // Silently fail if Sentry is not available
    }
  }
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}

/**
 * Log warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: LogContext): void {
  log('debug', message, context);
}

