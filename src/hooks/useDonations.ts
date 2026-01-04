'use client';

import { useState, useCallback } from 'react';

export interface Donation {
  id: string;
  parishId: string;
  paymentNumber: string;
  date: string;
  type: 'income';
  category: 'donation';
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

interface UseDonationsReturn {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchDonations: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    status?: 'pending' | 'completed' | 'cancelled';
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createDonation: (data: Partial<Donation>) => Promise<Donation | null>;
  updateDonation: (id: string, data: Partial<Donation>) => Promise<Donation | null>;
  deleteDonation: (id: string) => Promise<boolean>;
}

export function useDonations(): UseDonationsReturn {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseDonationsReturn['pagination']>(null);

  const fetchDonations = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/donations?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch donations');
      }

      setDonations(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch donations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createDonation = useCallback(async (data: Partial<Donation>): Promise<Donation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create donation');
      }

      // Refresh donations list
      await fetchDonations();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create donation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDonations]);

  const updateDonation = useCallback(async (id: string, data: Partial<Donation>): Promise<Donation | null> => {
    setLoading(true);
    setError(null);

    try {
      // Update donation via payments API (since donations are payments)
      const response = await fetch(`/api/accounting/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update donation');
      }

      // Refresh donations list
      await fetchDonations();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update donation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchDonations]);

  const deleteDonation = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Delete donation via payments API
      const response = await fetch(`/api/accounting/payments/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete donation');
      }

      // Refresh donations list
      await fetchDonations();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete donation';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchDonations]);

  return {
    donations,
    loading,
    error,
    pagination,
    fetchDonations,
    createDonation,
    updateDonation,
    deleteDonation,
  };
}



