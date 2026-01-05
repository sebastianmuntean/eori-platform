'use client';

/**
 * React Error Boundary component for catching and reporting React errors
 * Wraps the application to catch errors in the component tree
 */

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { captureException } from './sentry';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    captureException(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error, resetError }: { error: Error | null; resetError: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-gray-600">
            We're sorry, but something unexpected happened. Our team has been notified.
          </p>
        </div>

        {process.env.NODE_ENV !== 'production' && error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Error Details (Development Only):</p>
            <p className="mt-1 text-sm text-red-700">{error.message}</p>
            {error.stack && (
              <pre className="mt-2 max-h-48 overflow-auto text-xs text-red-600">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={resetError}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}



