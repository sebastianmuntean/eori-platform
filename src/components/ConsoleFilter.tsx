'use client';

import { useEffect } from 'react';

/**
 * Component that filters out Fast Refresh logs from the browser console
 * This helps keep the console clean during development
 */
export function ConsoleFilter() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // Store original console methods
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Filter function to check if message should be hidden
    const shouldFilter = (message: string): boolean => {
      if (typeof message !== 'string') {
        return false;
      }
      // Filter Fast Refresh messages
      return (
        message.includes('[Fast Refresh]') ||
        message.includes('Fast Refresh') ||
        message.includes('forward-logs-shared')
      );
    };

    // Override console.log
    console.log = (...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && shouldFilter(firstArg)) {
        return; // Suppress Fast Refresh logs
      }
      originalLog.apply(console, args);
    };

    // Override console.info
    console.info = (...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && shouldFilter(firstArg)) {
        return; // Suppress Fast Refresh logs
      }
      originalInfo.apply(console, args);
    };

    // Override console.debug
    console.debug = (...args: unknown[]) => {
      const firstArg = args[0];
      if (typeof firstArg === 'string' && shouldFilter(firstArg)) {
        return; // Suppress Fast Refresh logs
      }
      originalDebug.apply(console, args);
    };

    // Cleanup: restore original methods on unmount
    return () => {
      console.log = originalLog;
      console.info = originalInfo;
      console.debug = originalDebug;
    };
  }, []);

  return null; // This component doesn't render anything
}

