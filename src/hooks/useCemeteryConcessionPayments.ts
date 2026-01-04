'use client';

import { useState, useCallback } from 'react';

export interface CemeteryConcessionPayment {
  id: string;
  concessionId: string;
  parishId: string;
  paymentDate: string;
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  receiptNumber: string | null;
  receiptDate: string | null;
  transactionId: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
}

interface UseCemeteryConcessionPaymentsReturn {
  payments: CemeteryConcessionPayment[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchPayments: (params?: {
    concessionId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createPayment: (concessionId: string, data: Partial<CemeteryConcessionPayment>) => Promise<CemeteryConcessionPayment | null>;
  updatePayment: (id: string, data: Partial<CemeteryConcessionPayment>) => Promise<CemeteryConcessionPayment | null>;
  deletePayment: (id: string) => Promise<boolean>;
}

export function useCemeteryConcessionPayments(): UseCemeteryConcessionPaymentsReturn {
  const [payments, setPayments] = useState<CemeteryConcessionPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCemeteryConcessionPaymentsReturn['pagination']>(null);

  const fetchPayments = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      if (!params.concessionId) {
        throw new Error('Concession ID is required');
      }

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/cemeteries/concessions/${params.concessionId}/payments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments');
      }

      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayment = useCallback(async (
    concessionId: string,
    data: Partial<CemeteryConcessionPayment>
  ): Promise<CemeteryConcessionPayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/concessions/${concessionId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      setPayments((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayment = useCallback(async (
    id: string,
    data: Partial<CemeteryConcessionPayment>
  ): Promise<CemeteryConcessionPayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/concessions/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment');
      }

      setPayments((prev) => prev.map((payment) => (payment.id === id ? result.data : payment)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/concessions/payments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete payment');
      }

      setPayments((prev) => prev.filter((payment) => payment.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payments,
    loading,
    error,
    pagination,
    fetchPayments,
    createPayment,
    updatePayment,
    deletePayment,
  };
}

