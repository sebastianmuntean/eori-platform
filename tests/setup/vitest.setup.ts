import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables with test-safe defaults
// Only set if not already provided to allow test-specific overrides
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
}
(process.env as { NODE_ENV?: string }).NODE_ENV = 'test';

// Mock Next.js environment
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
}

// Store original console methods for selective suppression
const originalConsole = {
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// Suppress verbose console output in tests, but keep errors and warnings visible
// This helps with debugging while reducing noise
global.console = {
  ...console,
  // Suppress verbose logging in tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // Keep warnings and errors visible for debugging
  warn: originalConsole.warn,
  error: originalConsole.error,
};

// Setup for jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for responsive design tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver for component size-dependent tests
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })) as unknown as typeof ResizeObserver;
}
