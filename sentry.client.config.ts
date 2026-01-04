// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

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

      // Sanitize sensitive data from request
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
          delete event.request.headers['x-api-key'];
        }
        
        // Sanitize URL parameters that might contain sensitive data
        if (event.request.url) {
          try {
            const url = new URL(event.request.url);
            // Remove common sensitive query parameters
            const sensitiveParams = ['token', 'password', 'secret', 'key', 'api_key', 'access_token'];
            sensitiveParams.forEach(param => {
              if (url.searchParams.has(param)) {
                url.searchParams.set(param, '[REDACTED]');
              }
            });
            event.request.url = url.toString();
          } catch {
            // Invalid URL, keep as is
          }
        }
      }

      // Sanitize user context if PII is not enabled
      if (!process.env.SENTRY_SEND_PII && event.user) {
        // Only keep user ID, remove email and username
        event.user = { id: event.user.id };
      }

      // Remove sensitive data from contexts
      if (event.contexts) {
        Object.keys(event.contexts).forEach(key => {
          const context = event.contexts[key];
          if (context && typeof context === 'object') {
            // Remove common sensitive fields
            ['password', 'token', 'secret', 'apiKey', 'accessToken'].forEach(field => {
              if (field in context) {
                delete context[field];
              }
            });
          }
        });
      }

      return event;
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

