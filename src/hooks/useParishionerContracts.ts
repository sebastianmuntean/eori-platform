'use client';

import { useState, useCallback } from 'react';

export type ParishionerContractType = 'donation' | 'service' | 'rental' | 'other';
export type ParishionerContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';

export interface ParishionerContract {
  id: string;
  contractNumber: string;
  parishionerId: string;
  parishId: string;
  contractType: ParishionerContractType;
  status: ParishionerContractStatus;
  title: string | null;
  startDate: string;
  endDate: string | null;
  signingDate: string | null;
  amount: string | null;
  currency: string;
  terms: string | null;
  description: string | null;
  notes: string | null;
  renewalDate: string | null;
  autoRenewal: boolean;
  parentContractId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface UseParishionerContractsReturn {
  contracts: ParishionerContract[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchContracts: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    parishionerId?: string;
    contractType?: ParishionerContractType;
    status?: ParishionerContractStatus;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createContract: (data: Partial<ParishionerContract>) => Promise<ParishionerContract | null>;
  updateContract: (id: string, data: Partial<ParishionerContract>) => Promise<ParishionerContract | null>;
  deleteContract: (id: string) => Promise<boolean>;
  renewContract: (id: string, data: { startDate?: string; endDate?: string; amount?: string }) => Promise<ParishionerContract | null>;
}

export function useParishionerContracts(): UseParishionerContractsReturn {
  const [contracts, setContracts] = useState<ParishionerContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseParishionerContractsReturn['pagination']>(null);

  const fetchContracts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.parishionerId) queryParams.append('parishionerId', params.parishionerId);
      if (params.contractType) queryParams.append('contractType', params.contractType);
      if (params.status) queryParams.append('status', params.status);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/parishioners/contracts?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contracts');
      }

      setContracts(Array.isArray(result.data) ? result.data : []);
      setPagination(result.pagination || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contracts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createContract = useCallback(async (data: Partial<ParishionerContract>): Promise<ParishionerContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/parishioners/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create contract');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContract = useCallback(async (id: string, data: Partial<ParishionerContract>): Promise<ParishionerContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update contract');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContract = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/contracts/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete contract');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contract';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const renewContract = useCallback(async (id: string, data: { startDate?: string; endDate?: string; amount?: string }): Promise<ParishionerContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/parishioners/contracts/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to renew contract');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    contracts,
    loading,
    error,
    pagination,
    fetchContracts,
    createContract,
    updateContract,
    deleteContract,
    renewContract,
  };
}

