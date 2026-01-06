'use client';

import { useState, useCallback } from 'react';

export type PilgrimageStatus = 'draft' | 'open' | 'closed' | 'in_progress' | 'completed' | 'cancelled';

export interface Pilgrimage {
  id: string;
  parishId: string;
  title: string;
  description: string | null;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline: string | null;
  maxParticipants: number | null;
  minParticipants: number | null;
  status: PilgrimageStatus;
  pricePerPerson: string | null;
  currency: string;
  organizerName: string | null;
  organizerContact: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  updatedBy: string | null;
}

interface UsePilgrimagesReturn {
  pilgrimages: Pilgrimage[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchPilgrimages: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    status?: PilgrimageStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createPilgrimage: (data: Partial<Pilgrimage>) => Promise<Pilgrimage | null>;
  updatePilgrimage: (id: string, data: Partial<Pilgrimage>) => Promise<Pilgrimage | null>;
  deletePilgrimage: (id: string) => Promise<boolean>;
  approvePilgrimage: (id: string) => Promise<boolean>;
  publishPilgrimage: (id: string) => Promise<boolean>;
  closePilgrimage: (id: string) => Promise<boolean>;
  cancelPilgrimage: (id: string) => Promise<boolean>;
}

export function usePilgrimages(): UsePilgrimagesReturn {
  const [pilgrimages, setPilgrimages] = useState<Pilgrimage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePilgrimagesReturn['pagination']>(null);

  const fetchPilgrimages = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    status?: PilgrimageStatus;
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
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/pilgrimages?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pilgrimages');
      }

      setPilgrimages(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pilgrimages';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPilgrimage = useCallback(async (data: Partial<Pilgrimage>): Promise<Pilgrimage | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pilgrimages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create pilgrimage');
      }

      setPilgrimages((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pilgrimage';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePilgrimage = useCallback(async (
    id: string,
    data: Partial<Pilgrimage>
  ): Promise<Pilgrimage | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update pilgrimage');
      }

      setPilgrimages((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pilgrimage';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePilgrimage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete pilgrimage');
      }

      setPilgrimages((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pilgrimage';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const approvePilgrimage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve pilgrimage');
      }

      setPilgrimages((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve pilgrimage';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishPilgrimage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}/publish`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to publish pilgrimage');
      }

      setPilgrimages((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to publish pilgrimage';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const closePilgrimage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}/close`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to close pilgrimage');
      }

      setPilgrimages((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close pilgrimage';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelPilgrimage = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pilgrimages/${id}/cancel`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel pilgrimage');
      }

      setPilgrimages((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel pilgrimage';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pilgrimages,
    loading,
    error,
    pagination,
    fetchPilgrimages,
    createPilgrimage,
    updatePilgrimage,
    deletePilgrimage,
    approvePilgrimage,
    publishPilgrimage,
    closePilgrimage,
    cancelPilgrimage,
  };
}






