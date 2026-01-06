import type { PgTable } from 'drizzle-orm/pg-core';
import {
  createMockDatabase,
  setMockSelectData,
  getMockSelectData,
  type MockDatabase,
} from '../../utils/db-mock';

/**
 * Mock database instance
 * Each test should get a fresh instance to avoid state leakage
 */
let mockDb: (MockDatabase & { _selectBuilder: ReturnType<typeof createMockDatabase>['_selectBuilder'] }) | null = null;

/**
 * Get or create a fresh mock database instance
 * For test isolation, prefer creating a new instance per test
 */
export function getMockDatabase(): MockDatabase & { _selectBuilder: ReturnType<typeof createMockDatabase>['_selectBuilder'] } {
  if (!mockDb) {
    mockDb = createMockDatabase();
  }
  return mockDb;
}

/**
 * Create a fresh mock database instance
 * Use this in beforeEach to ensure test isolation
 */
export function createFreshMockDatabase(): MockDatabase & { _selectBuilder: ReturnType<typeof createMockDatabase>['_selectBuilder'] } {
  return createMockDatabase();
}

/**
 * Reset the singleton mock database instance
 * Useful for cleanup between test suites
 */
export function resetMockDatabase(): void {
  mockDb = null;
}

/**
 * Mock drizzle database client
 * This is a proxy that delegates to the mock database
 * 
 * NOTE: This file should NOT use vi.mock() - that should be done in test files
 * or in a setup file. This file just provides the mock implementation.
 */
export const db = new Proxy({} as MockDatabase, {
  get(_target, prop: string | symbol) {
    const mockDbInstance = getMockDatabase();
    if (typeof prop === 'string') {
      return (mockDbInstance as Record<string, unknown>)[prop];
    }
    return undefined;
  },
}) as MockDatabase;

// Re-export helper functions for convenience
export { setMockSelectData, getMockSelectData };
