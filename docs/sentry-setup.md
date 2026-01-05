# Sentry Error Tracking Setup

This document describes the Sentry error tracking integration implemented in the EORI Platform.

## Overview

Sentry has been integrated to provide comprehensive error tracking and monitoring for both client-side and server-side errors. The integration includes:

- Automatic error capture from React components
- API route error tracking
- Breadcrumb tracking for debugging
- Source map uploads for better stack traces
- Session replay for error investigation

## Configuration Files

### Sentry Config Files

The following configuration files are automatically loaded by Next.js:

- `sentry.client.config.ts` - Client-side (browser) configuration
- `sentry.server.config.ts` - Server-side (Node.js) configuration
- `sentry.edge.config.ts` - Edge runtime configuration

### Core Files

- `src/lib/monitoring/sentry.ts` - Sentry initialization and utility functions
- `src/lib/monitoring/error-boundary.tsx` - React error boundary component
- `src/instrumentation.ts` - Server-side initialization hook
- `next.config.js` - Sentry webpack plugin configuration

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Sentry Configuration (REQUIRED)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here

# Sentry Source Map Upload Configuration (for CI/CD builds)
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token  # For source map uploads

# Sentry Privacy Configuration (OPTIONAL)
# Set to 'true' to enable sending Personally Identifiable Information (PII)
# Default: false (PII is disabled by default for privacy)
SENTRY_SEND_PII=false
```

**Important Security Notes:**
- `NEXT_PUBLIC_SENTRY_DSN` is **required** - Sentry will not initialize without it
- **Never commit DSN or auth tokens to version control**
- `SENTRY_SEND_PII` defaults to `false` - only enable if you need user email/username in error reports
- All sensitive data (passwords, tokens, API keys) is automatically sanitized before sending to Sentry

### Getting Your Sentry DSN

1. Sign up or log in to [Sentry](https://sentry.io)
2. Create a new project (or select an existing one)
3. Copy the DSN from the project settings
4. Add it to your environment variables

### Getting Your Auth Token (for source maps)

1. Go to Sentry Settings > Auth Tokens
2. Create a new token with the following scopes:
   - `project:releases`
   - `org:read`
3. Add it to your environment variables

## Features

### Error Tracking

Errors are automatically captured in the following scenarios:

1. **React Component Errors**: Caught by the ErrorBoundary component
2. **API Route Errors**: Automatically captured by Sentry's Next.js integration
3. **Manual Error Logging**: Using `logError()` from `src/lib/errors.ts`

### Breadcrumb Tracking

Breadcrumbs are automatically added for:

- API requests (via `logRequest()` in `src/lib/logger.ts`)
- Errors (via `logError()` in `src/lib/logger.ts`)

### Source Maps

Source maps are automatically uploaded during the build process when:
- `NEXT_PUBLIC_SENTRY_DSN` is set
- `SENTRY_ORG` and `SENTRY_PROJECT` are configured
- `SENTRY_AUTH_TOKEN` is provided

## Usage

### Manual Error Capture

```typescript
import { logError } from '@/lib/errors';

try {
  // Your code
} catch (error) {
  logError('Operation failed', error, { userId: '123', operation: 'createUser' });
}
```

### Adding Breadcrumbs

```typescript
import { logRequest } from '@/lib/logger';

logRequest('/api/users', 'GET', { userId: '123' });
```

### Setting User Context

```typescript
import { setUser } from '@/lib/monitoring/sentry';

setUser({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

### Custom Error Boundary

```typescript
import { ErrorBoundary } from '@/lib/monitoring/error-boundary';

function CustomFallback({ error, resetError }) {
  return <div>Custom error UI</div>;
}

<ErrorBoundary fallback={CustomFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Production vs Development

- **Development**: Sentry is disabled by default. Errors are only logged to the console.
- **Production**: Sentry is enabled when `NEXT_PUBLIC_SENTRY_DSN` is set. All errors are sent to Sentry.

## Security & Privacy

### Data Sanitization

The Sentry integration automatically sanitizes sensitive data before sending events:

**Automatically Removed:**
- Authorization headers (Bearer tokens, API keys)
- Cookie headers
- Sensitive URL query parameters (token, password, secret, key, api_key, access_token)
- Sensitive context fields (password, token, secret, apiKey, accessToken, databaseUrl)

**User Data:**
- By default, only user ID is sent (email and username are removed)
- Set `SENTRY_SEND_PII=true` to include email and username (opt-in)

**Example:**
```typescript
// This URL: /api/users?token=secret123&id=456
// Becomes: /api/users?token=[REDACTED]&id=456
```

### Best Practices

1. **Never commit DSN or auth tokens** - Always use environment variables
2. **Review Sentry dashboard regularly** - Ensure no sensitive data is being captured
3. **Use SENTRY_SEND_PII sparingly** - Only enable if necessary for debugging
4. **Monitor error rates** - High error rates may indicate issues

## Performance

- **Traces Sample Rate**: 10% in production, 100% in development
- **Session Replay**: 10% of sessions, 100% of sessions with errors
- **Source Maps**: Automatically uploaded during build

## Filtering

The following errors are automatically filtered out:

- Browser extension errors
- Network errors (expected failures)
- ResizeObserver errors (non-critical)
- Database connection errors (handled separately)

## Monitoring

Once configured, you can monitor errors in the Sentry dashboard:

1. Go to your Sentry project
2. View errors in the Issues tab
3. See performance data in the Performance tab
4. Review session replays in the Replays tab

## Troubleshooting

### Errors Not Appearing in Sentry

1. Verify `NEXT_PUBLIC_SENTRY_DSN` is set correctly
2. Check that `NODE_ENV=production` in production
3. Verify network connectivity to Sentry
4. Check browser console for Sentry initialization errors

### Source Maps Not Uploading

1. Verify `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are set
2. Check that the auth token has the correct permissions
3. Review build logs for Sentry upload errors

### Too Many Errors

1. Adjust the `tracesSampleRate` in the config files
2. Add more errors to the `ignoreErrors` array
3. Use `beforeSend` hook to filter specific errors

## Next Steps

For advanced configuration, refer to the [Sentry Next.js documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/).

