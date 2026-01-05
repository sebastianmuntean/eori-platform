// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Only initialize Sentry if DSN is configured
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Only export onRequestError if Sentry is configured
export const onRequestError = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? Sentry.captureRequestError
  : undefined;

