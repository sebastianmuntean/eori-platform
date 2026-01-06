// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

// Constants for sensitive data sanitization
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'] as const;
const SENSITIVE_QUERY_PARAMS = ['token', 'password', 'secret', 'key', 'api_key', 'access_token'] as const;
const REDACTED_VALUE = '[REDACTED]';

/**
 * Removes sensitive headers from the request headers object
 */
function sanitizeHeaders(headers: Record<string, unknown>): void {
  SENSITIVE_HEADERS.forEach(header => {
    delete headers[header];
  });
}

/**
 * Sanitizes sensitive query parameters in a URL by replacing their values with [REDACTED]
 */
function sanitizeUrlParams(urlString: string): string {
  try {
    const url = new URL(urlString);
    SENSITIVE_QUERY_PARAMS.forEach(param => {
      if (url.searchParams.has(param)) {
        url.searchParams.set(param, REDACTED_VALUE);
      }
    });
    return url.toString();
  } catch {
    // Invalid URL, return original string
    return urlString;
  }
}

/**
 * Sanitizes user data, keeping only the user ID if PII is not enabled
 */
function sanitizeUserData(user: Sentry.User): Sentry.User {
  return { id: user.id };
}

/**
 * Sanitizes sensitive data from a Sentry event before sending
 */
function sanitizeEvent<T extends Sentry.Event>(event: T): T {
  // Sanitize request data
  if (event.request) {
    if (event.request.headers) {
      sanitizeHeaders(event.request.headers as Record<string, unknown>);
    }

    if (event.request.url) {
      event.request.url = sanitizeUrlParams(event.request.url);
    }
  }

  // Sanitize user context if PII is not enabled
  if (!process.env.SENTRY_SEND_PII && event.user) {
    event.user = sanitizeUserData(event.user);
  }

  return event;
}

// Only initialize Sentry if DSN is configured
if (dsn) {
  Sentry.init({
    dsn,

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: isProduction ? 0.1 : 1,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information) - opt-in via environment variable
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: process.env.SENTRY_SEND_PII === 'true',

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Don't send events in development
      if (!isProduction) {
        return null;
      }

      return sanitizeEvent(event);
    },

    // Ignore specific errors
    ignoreErrors: [
      'NetworkError',
      'Network request failed',
    ],
  });
} else if (isProduction) {
  console.warn('Sentry DSN not configured. Error tracking is disabled.');
}
