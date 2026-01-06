'use client';

import { useState, useCallback } from 'react';

export interface Payment {
  id: string;
  parishId: string;
  paymentNumber: string;
  date: string;
  type: 'income' | 'expense';
  category: string | null;
  clientId: string | null;
  amount: string;
  currency: string;
  description: string | null;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'check' | null;
  referenceNumber: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

interface PaymentSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
}

interface UsePaymentsReturn {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  summary: PaymentSummary | null;
  fetchPayments: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: 'income' | 'expense';
    status?: 'pending' | 'completed' | 'cancelled';
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  fetchSummary: (params?: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: 'income' | 'expense';
  }) => Promise<void>;
  createPayment: (data: import('@/lib/types/payments').CreatePaymentData) => Promise<Payment | null>;
  updatePayment: (id: string, data: import('@/lib/types/payments').UpdatePaymentData) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<boolean>;
}

export function usePayments(): UsePaymentsReturn {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePaymentsReturn['pagination']>(null);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);

  const fetchPayments = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    type?: 'income' | 'expense';
    status?: 'pending' | 'completed' | 'cancelled';
    category?: string;
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
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/payments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments');
      }

      setPayments(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (params: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
    type?: 'income' | 'expense';
  } = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.type) queryParams.append('type', params.type);

      const response = await fetch(`/api/accounting/payments/summary?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch summary');
      }

      setSummary(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch summary';
      setError(errorMessage);
    }
  }, []);

  const createPayment = useCallback(async (data: import('@/lib/types/payments').CreatePaymentData): Promise<Payment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment');
      }

      // Refresh payments list
      await fetchPayments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  const updatePayment = useCallback(async (id: string, data: import('@/lib/types/payments').UpdatePaymentData): Promise<Payment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment');
      }

      // Refresh payments list
      await fetchPayments();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  const deletePayment = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/payments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete payment');
      }

      // Refresh payments list
      await fetchPayments();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    pagination,
    summary,
    fetchPayments,
    fetchSummary,
    createPayment,
    updatePayment,
    deletePayment,
  };
}



