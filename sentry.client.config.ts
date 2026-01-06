// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

// Constants for sensitive data sanitization
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key'] as const;
const SENSITIVE_QUERY_PARAMS = ['token', 'password', 'secret', 'key', 'api_key', 'access_token'] as const;
const SENSITIVE_CONTEXT_FIELDS = ['password', 'token', 'secret', 'apiKey', 'accessToken'] as const;
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
 * Removes sensitive fields from an object context
 */
function sanitizeContextObject(context: Record<string, unknown>): void {
  SENSITIVE_CONTEXT_FIELDS.forEach(field => {
    if (field in context) {
      delete context[field];
    }
  });
}

/**
 * Sanitizes sensitive data from all contexts in the event
 */
function sanitizeEventContexts(contexts: Record<string, unknown>): void {
  Object.values(contexts).forEach(context => {
    if (context && typeof context === 'object' && !Array.isArray(context)) {
      sanitizeContextObject(context as Record<string, unknown>);
    }
  });
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

  // Sanitize contexts
  if (event.contexts) {
    sanitizeEventContexts(event.contexts);
  }

  return event;
}

// Only initialize Sentry if DSN is configured
if (dsn) {
  Sentry.init({
    dsn,

    // Add optional integrations for additional features
    integrations: [Sentry.replayIntegration()],

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: isProduction ? 0.1 : 1,
    
    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Define how likely Replay events are sampled.
    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // Define how likely Replay events are sampled when an error occurs.
    replaysOnErrorSampleRate: 1.0,

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
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // Network errors
      'NetworkError',
      'Network request failed',
      // ResizeObserver errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
  });
} else if (isProduction) {
  console.warn('Sentry DSN not configured. Error tracking is disabled.');
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

