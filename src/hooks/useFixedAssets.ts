'use client';

import { useState, useCallback } from 'react';

export interface FixedAsset {
  id: string;
  parishId: string;
  inventoryNumber: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string | null;
  location: string | null;
  acquisitionDate: string | null;
  acquisitionValue: string | null;
  currentValue: string | null;
  depreciationMethod: string | null;
  usefulLifeYears: number | null;
  status: 'active' | 'inactive' | 'disposed' | 'damaged';
  disposalDate: string | null;
  disposalValue: string | null;
  disposalReason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface UseFixedAssetsReturn {
  fixedAssets: FixedAsset[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchFixedAssets: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    category?: string;
    type?: string;
    status?: 'active' | 'inactive' | 'disposed' | 'damaged';
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createFixedAsset: (data: Partial<FixedAsset>) => Promise<FixedAsset | null>;
  updateFixedAsset: (id: string, data: Partial<FixedAsset>) => Promise<FixedAsset | null>;
  deleteFixedAsset: (id: string) => Promise<boolean>;
}

export function useFixedAssets(): UseFixedAssetsReturn {
  const [fixedAssets, setFixedAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseFixedAssetsReturn['pagination']>(null);

  const fetchFixedAssets = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.category) queryParams.append('category', params.category);
      if (params.type) queryParams.append('type', params.type);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/fixed-assets?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch fixed assets');
      }

      setFixedAssets(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fixed assets';
      setError(errorMessage);
      console.error('Error fetching fixed assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFixedAsset = useCallback(async (data: Partial<FixedAsset>): Promise<FixedAsset | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create fixed asset');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create fixed asset';
      setError(errorMessage);
      console.error('Error creating fixed asset:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFixedAsset = useCallback(async (id: string, data: Partial<FixedAsset>): Promise<FixedAsset | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/fixed-assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update fixed asset');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update fixed asset';
      setError(errorMessage);
      console.error('Error updating fixed asset:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFixedAsset = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/fixed-assets/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete fixed asset');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete fixed asset';
      setError(errorMessage);
      console.error('Error deleting fixed asset:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fixedAssets,
    loading,
    error,
    pagination,
    fetchFixedAssets,
    createFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
  };
}



