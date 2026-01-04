'use client';

import { useState, useCallback } from 'react';

export interface CemeteryConcession {
  id: string;
  graveId: string;
  cemeteryId: string;
  parishId: string;
  holderClientId: string;
  contractNumber: string;
  contractDate: string;
  startDate: string;
  expiryDate: string;
  durationYears: number;
  annualFee: string;
  currency: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  isExpired: boolean;
  expiresInDays: number | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseCemeteryConcessionsReturn {
  concessions: CemeteryConcession[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchConcessions: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    cemeteryId?: string;
    graveId?: string;
    status?: string;
    clientId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createConcession: (data: Partial<CemeteryConcession>) => Promise<CemeteryConcession | null>;
  updateConcession: (id: string, data: Partial<CemeteryConcession>) => Promise<CemeteryConcession | null>;
  deleteConcession: (id: string) => Promise<boolean>;
}

export function useCemeteryConcessions(): UseCemeteryConcessionsReturn {
  const [concessions, setConcessions] = useState<CemeteryConcession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseCemeteryConcessionsReturn['pagination']>(null);

  const fetchConcessions = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.cemeteryId) queryParams.append('cemeteryId', params.cemeteryId);
      if (params.graveId) queryParams.append('graveId', params.graveId);
      if (params.status) queryParams.append('status', params.status);
      if (params.clientId) queryParams.append('clientId', params.clientId);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/cemeteries/concessions?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch concessions');
      }

      setConcessions(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch concessions';
      setError(errorMessage);
      console.error('Error fetching concessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createConcession = useCallback(async (data: Partial<CemeteryConcession>): Promise<CemeteryConcession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cemeteries/concessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create concession');
      }

      setConcessions((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create concession';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConcession = useCallback(async (
    id: string,
    data: Partial<CemeteryConcession>
  ): Promise<CemeteryConcession | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/concessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update concession');
      }

      setConcessions((prev) => prev.map((concession) => (concession.id === id ? result.data : concession)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update concession';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConcession = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/concessions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete concession');
      }

      setConcessions((prev) => prev.filter((concession) => concession.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete concession';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    concessions,
    loading,
    error,
    pagination,
    fetchConcessions,
    createConcession,
    updateConcession,
    deleteConcession,
  };
}

