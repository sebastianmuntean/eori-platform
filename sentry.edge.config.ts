// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isProduction = process.env.NODE_ENV === 'production';

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

      return event;
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
