/**
 * Shared types for CRUD hooks
 */

/**
 * Standard pagination information returned by API endpoints
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Invoice summary information
 */
export interface InvoiceSummary {
  totalIssued: number;
  totalReceived: number;
  unpaidCount: number;
  overdueCount: number;
}

/**
 * Payment summary information
 */
export interface PaymentSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
}

/**
 * Standard sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Base parameters for entity fetching
 */
export interface BaseFetchParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: SortOrder;
  search?: string;
}

