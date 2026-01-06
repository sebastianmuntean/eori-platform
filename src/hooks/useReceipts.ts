'use client';

import { useState, useCallback } from 'react';

export type ReceiptStatus = 'draft' | 'issued' | 'cancelled';

export interface Receipt {
  id: string;
  receiptNumber: string;
  parishionerId: string;
  parishId: string;
  receiptDate: string;
  amount: string;
  currency: string;
  purpose: string | null;
  paymentMethod: string | null;
  status: ReceiptStatus;
  notes: string | null;
  issuedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseReceiptsReturn {
  receipts: Receipt[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchReceipts: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    parishionerId?: string;
    status?: ReceiptStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createReceipt: (data: Partial<Receipt>) => Promise<Receipt | null>;
  updateReceipt: (id: string, data: Partial<Receipt>) => Promise<Receipt | null>;
  deleteReceipt: (id: string) => Promise<boolean>;
  getNextReceiptNumber: (parishId?: string) => Promise<string | null>;
}

export function useReceipts(): UseReceiptsReturn {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseReceiptsReturn['pagination']>(null);

  const fetchReceipts = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    parishionerId?: string;
    status?: ReceiptStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.parishionerId) queryParams.append('parishionerId', params.parishionerId);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/parishioners/receipts?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch receipts');
      }

      setReceipts(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch receipts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createReceipt = useCallback(async (data: Partial<Receipt>): Promise<Receipt | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parishioners/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create receipt');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create receipt';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReceipt = useCallback(async (id: string, data: Partial<Receipt>): Promise<Receipt | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update receipt');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update receipt';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReceipt = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/receipts/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete receipt');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete receipt';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNextReceiptNumber = useCallback(async (parishId?: string): Promise<string | null> => {
    try {
      const queryParams = new URLSearchParams();
      if (parishId) queryParams.append('parishId', parishId);

      const response = await fetch(`/api/parishioners/receipts/next-number?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get next receipt number');
      }

      return result.data.nextNumber.toString();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get next receipt number';
      setError(errorMessage);
      return null;
    }
  }, []);

  return {
    receipts,
    loading,
    error,
    pagination,
    fetchReceipts,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    getNextReceiptNumber,
  };
}






