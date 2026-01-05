'use client';

import { useState, useCallback } from 'react';

export interface Burial {
  id: string;
  graveId: string;
  cemeteryId: string;
  parishId: string;
  deceasedClientId: string | null;
  deceasedName: string;
  deceasedBirthDate: string | null;
  deceasedDeathDate: string;
  burialDate: string;
  burialCertificateNumber: string | null;
  burialCertificateDate: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseBurialsReturn {
  burials: Burial[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchBurials: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    cemeteryId?: string;
    graveId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createBurial: (data: Partial<Burial>) => Promise<Burial | null>;
  updateBurial: (id: string, data: Partial<Burial>) => Promise<Burial | null>;
  deleteBurial: (id: string) => Promise<boolean>;
}

export function useBurials(): UseBurialsReturn {
  const [burials, setBurials] = useState<Burial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseBurialsReturn['pagination']>(null);

  const fetchBurials = useCallback(async (params = {}) => {
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
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/cemeteries/burials?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch burials');
      }

      setBurials(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch burials';
      setError(errorMessage);
      console.error('Error fetching burials:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBurial = useCallback(async (data: Partial<Burial>): Promise<Burial | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cemeteries/burials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create burial');
      }

      setBurials((prev) => [...prev, result.data]);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create burial';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBurial = useCallback(async (
    id: string,
    data: Partial<Burial>
  ): Promise<Burial | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/burials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update burial');
      }

      setBurials((prev) => prev.map((burial) => (burial.id === id ? result.data : burial)));
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update burial';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteBurial = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/cemeteries/burials/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete burial');
      }

      setBurials((prev) => prev.filter((burial) => burial.id !== id));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete burial';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    burials,
    loading,
    error,
    pagination,
    fetchBurials,
    createBurial,
    updateBurial,
    deleteBurial,
  };
}



