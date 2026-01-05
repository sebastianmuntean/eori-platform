/**
 * Sentry utility functions for error tracking
 * Note: Sentry initialization is handled by sentry.client.config.ts, sentry.server.config.ts, and sentry.edge.config.ts
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an exception to Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture a message to Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id?: string; email?: string; username?: string } | null): void {
  Sentry.setUser(user);
}

/**
 * Set additional context
 */
export function setContext(key: string, context: Record<string, any>): void {
  Sentry.setContext(key, context);
}

/**
 * Set tags for filtering
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

