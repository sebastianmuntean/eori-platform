'use client';

import { useState, useCallback } from 'react';

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PilgrimagePayment {
  id: string;
  pilgrimageId: string;
  participantId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  status: PaymentStatus;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PaymentSummary {
  payments: {
    totalAmount: number;
    totalPayments: number;
    completedAmount: number;
    pendingAmount: number;
    byMethod: Record<string, number>;
  };
  revenue: {
    total: number;
    paid: number;
    outstanding: number;
  };
}

interface UsePilgrimagePaymentsReturn {
  payments: PilgrimagePayment[];
  summary: PaymentSummary | null;
  loading: boolean;
  error: string | null;
  fetchPayments: (pilgrimageId: string, params?: {
    participantId?: string;
    status?: PaymentStatus;
  }) => Promise<void>;
  addPayment: (pilgrimageId: string, data: Partial<PilgrimagePayment>) => Promise<PilgrimagePayment | null>;
  updatePayment: (pilgrimageId: string, paymentId: string, data: Partial<PilgrimagePayment>) => Promise<PilgrimagePayment | null>;
  deletePayment: (pilgrimageId: string, paymentId: string) => Promise<boolean>;
  getPaymentSummary: (pilgrimageId: string) => Promise<void>;
}

export function usePilgrimagePayments(): UsePilgrimagePaymentsReturn {
  const [payments, setPayments] = useState<PilgrimagePayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async (pilgrimageId: string, params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.participantId) queryParams.append('participantId', params.participantId);
      if (params.status) queryParams.append('status', params.status);

      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/payments?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments');
      }

      setPayments(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPayment = useCallback(async (
    pilgrimageId: string,
    data: Partial<PilgrimagePayment>
  ): Promise<PilgrimagePayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add payment');
      }

      setPayments((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePayment = useCallback(async (
    pilgrimageId: string,
    paymentId: string,
    data: Partial<PilgrimagePayment>
  ): Promise<PilgrimagePayment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment');
      }

      setPayments((prev) => prev.map((p) => (p.id === paymentId ? result.data : p)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePayment = useCallback(async (
    pilgrimageId: string,
    paymentId: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete payment');
      }

      setPayments((prev) => prev.filter((p) => p.id !== paymentId));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete payment';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentSummary = useCallback(async (pilgrimageId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${pilgrimageId}/payments/summary`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payment summary');
      }

      setSummary(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment summary';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    payments,
    summary,
    loading,
    error,
    fetchPayments,
    addPayment,
    updatePayment,
    deletePayment,
    getPaymentSummary,
  };
}



