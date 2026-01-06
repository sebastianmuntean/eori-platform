import { vi } from 'vitest';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

/**
 * Mock database query result
 */
export type MockQueryResult<T = unknown> = T[];

/**
 * Table instance to mock data mapping
 * Uses WeakMap to avoid memory leaks and work with any table instance
 */
const tableDataMap = new WeakMap<PgTable, unknown[]>();

/**
 * Get a unique identifier for a table instance
 */
function getTableKey(table: PgTable): PgTable {
  return table;
}

/**
 * Get mock data for a table
 */
function getTableData(table: PgTable): unknown[] {
  return tableDataMap.get(table) || [];
}

/**
 * Set mock data for a table
 */
function setTableData(table: PgTable, data: unknown[]): void {
  tableDataMap.set(table, data);
}

/**
 * Mock query builder that supports chaining
 * Supports: where, orderBy, limit, offset, leftJoin, innerJoin, groupBy
 */
export class MockQueryBuilder<T = unknown> {
  private _whereClause: SQL | undefined;
  private _orderByClause: unknown;
  private _limitValue: number | undefined;
  private _offsetValue: number | undefined;
  private _joinClauses: Array<{ type: 'left' | 'inner' | 'right'; table: PgTable; condition: SQL }> = [];
  private _groupByClause: unknown;
  private _mockData: T[];
  private _columnSelection: Record<string, unknown> | undefined;

  constructor(mockData: T[] = [], columnSelection?: Record<string, unknown>) {
    this._mockData = [...mockData]; // Create a copy to avoid mutations
    this._columnSelection = columnSelection;
  }

  where(condition: SQL): this {
    this._whereClause = condition;
    return this;
  }

  orderBy(orderByClause: unknown): this {
    this._orderByClause = orderByClause;
    return this;
  }

  limit(count: number): this {
    this._limitValue = count;
    return this;
  }

  offset(count: number): this {
    this._offsetValue = count;
    return this;
  }

  leftJoin(table: PgTable, condition: SQL): this {
    this._joinClauses.push({ type: 'left', table, condition });
    return this;
  }

  innerJoin(table: PgTable, condition: SQL): this {
    this._joinClauses.push({ type: 'inner', table, condition });
    return this;
  }

  rightJoin(table: PgTable, condition: SQL): this {
    this._joinClauses.push({ type: 'right', table, condition });
    return this;
  }

  groupBy(groupByClause: unknown): this {
    this._groupByClause = groupByClause;
    return this;
  }

  /**
   * Apply column selection if specified
   */
  private applyColumnSelection(data: T[]): unknown[] {
    if (!this._columnSelection) {
      return data;
    }

    return data.map((row) => {
      const selected: Record<string, unknown> = {};
      for (const [key, selector] of Object.entries(this._columnSelection || {})) {
        // If selector is a function/column reference, try to extract value
        // For now, we'll use the key to get the value from the row
        if (typeof row === 'object' && row !== null) {
          const rowObj = row as Record<string, unknown>;
          // Try to find the value by key or by the selector's name
          selected[key] = rowObj[key] ?? (selector as { name?: string })?.name 
            ? rowObj[(selector as { name: string }).name] 
            : undefined;
        }
      }
      return selected;
    });
  }

  /**
   * Apply pagination (limit and offset)
   */
  private applyPagination(data: unknown[]): unknown[] {
    let result = data;
    
    if (this._offsetValue !== undefined) {
      result = result.slice(this._offsetValue);
    }
    
    if (this._limitValue !== undefined) {
      result = result.slice(0, this._limitValue);
    }
    
    return result;
  }

  async then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      // Apply column selection
      let result = this.applyColumnSelection(this._mockData) as T[];
      
      // Apply pagination
      result = this.applyPagination(result) as T[];
      
      return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }
}

/**
 * Mock select query builder
 * Supports both select() and select({ ...columns })
 */
export class MockSelectBuilder {
  private _columnSelection: Record<string, unknown> | undefined;

  /**
   * Select with column specification
   */
  select(columns?: Record<string, unknown>): this {
    this._columnSelection = columns;
    return this;
  }

  from(table: PgTable): MockQueryBuilder {
    const mockData = getTableData(table);
    const builder = new MockQueryBuilder(mockData, this._columnSelection);
    return builder;
  }
}

/**
 * Mock database client interface
 */
export interface MockDatabase {
  select: (columns?: Record<string, unknown>) => MockSelectBuilder;
  insert: (table: PgTable) => MockInsertBuilder;
  update: (table: PgTable) => MockUpdateBuilder;
  delete: (table: PgTable) => MockDeleteBuilder;
  transaction: <T>(callback: (tx: MockDatabase) => Promise<T>) => Promise<T>;
}

/**
 * Mock insert builder
 */
export class MockInsertBuilder {
  private _table: PgTable;
  private _values: unknown[] = [];

  constructor(table: PgTable) {
    this._table = table;
  }

  values(values: unknown | unknown[]): this {
    this._values = Array.isArray(values) ? values : [values];
    return this;
  }

  async returning(): Promise<unknown[]> {
    // Store inserted values in the table data map
    const existingData = getTableData(this._table);
    const newData = [...existingData, ...this._values];
    setTableData(this._table, newData);
    return this._values;
  }
}

/**
 * Mock update builder
 */
export class MockUpdateBuilder {
  private _table: PgTable;
  private _setValues: Record<string, unknown> = {};
  private _whereClause: SQL | undefined;

  constructor(table: PgTable) {
    this._table = table;
  }

  set(values: Record<string, unknown>): this {
    this._setValues = values;
    return this;
  }

  where(condition: SQL): this {
    this._whereClause = condition;
    return this;
  }

  async returning(): Promise<unknown[]> {
    // In a real implementation, this would update matching rows
    // For now, return empty array
    return [];
  }
}

/**
 * Mock delete builder
 */
export class MockDeleteBuilder {
  private _table: PgTable;
  private _whereClause: SQL | undefined;

  constructor(table: PgTable) {
    this._table = table;
  }

  where(condition: SQL): this {
    this._whereClause = condition;
    return this;
  }

  async then<TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      // In a real implementation, this would delete matching rows
      const result: unknown[] = [];
      return onfulfilled ? onfulfilled(result) : (result as unknown as TResult1);
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }
}

/**
 * Create a mock database instance
 * Each instance has its own select builder to maintain isolation
 */
export function createMockDatabase(): MockDatabase & { _selectBuilder: MockSelectBuilder } {
  const selectBuilder = new MockSelectBuilder();

  const db = {
    select: (columns?: Record<string, unknown>) => {
      const builder = new MockSelectBuilder();
      if (columns) {
        builder.select(columns);
      }
      return builder;
    },
    insert: (table: PgTable) => new MockInsertBuilder(table),
    update: (table: PgTable) => new MockUpdateBuilder(table),
    delete: (table: PgTable) => new MockDeleteBuilder(table),
    transaction: async <T>(callback: (tx: MockDatabase) => Promise<T>): Promise<T> => {
      // Create a new database instance for the transaction
      const txDb = createMockDatabase();
      return callback(txDb);
    },
    _selectBuilder: selectBuilder, // Expose for setting mock data
  };

  return db;
}

/**
 * Helper to set mock data for a select query on a specific table
 * Uses WeakMap internally for proper table instance tracking
 */
export function setMockSelectData(
  db: MockDatabase & { _selectBuilder: MockSelectBuilder },
  table: PgTable,
  data: unknown[]
): void {
  setTableData(table, data);
}

/**
 * Helper to get mock data for a table
 */
export function getMockSelectData(table: PgTable): unknown[] {
  return getTableData(table);
}

/**
 * Clear all mock data (useful for test cleanup)
 */
export function clearMockData(): void {
  // WeakMap doesn't have a clear method, but we can create a new one
  // For now, this is a no-op as WeakMap automatically handles garbage collection
  // In practice, tests should reset data manually
}

/**
 * Create a mock database with predefined data
 * @param dataMap - Map of table instances to their mock data arrays
 */
export function createMockDatabaseWithData(
  dataMap: Map<PgTable, unknown[]> | Record<string, unknown[]>
): MockDatabase & { _selectBuilder: MockSelectBuilder } {
  const db = createMockDatabase();
  
  if (dataMap instanceof Map) {
    // If it's a Map with table instances as keys
    dataMap.forEach((data, table) => {
      setTableData(table, data);
    });
  } else {
    // Legacy support: if it's a record, we can't map it properly
    // This is a limitation - prefer using Map with table instances
    console.warn('createMockDatabaseWithData: Record format is deprecated. Use Map<PgTable, unknown[]> instead.');
  }
  
  return db;
}
