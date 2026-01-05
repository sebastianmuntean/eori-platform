'use client';

import { useState, useCallback } from 'react';

export interface EmploymentContract {
  id: string;
  employeeId: string;
  contractNumber: string;
  contractType: 'indeterminate' | 'determinate' | 'part_time' | 'internship' | 'consultant';
  startDate: string;
  endDate: string | null;
  probationEndDate: string | null;
  baseSalary: string;
  currency: string;
  workingHoursPerWeek: number;
  workLocation: string | null;
  jobDescription: string | null;
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended';
  terminationDate: string | null;
  terminationReason: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseEmploymentContractsReturn {
  contracts: EmploymentContract[];
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
    employeeId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createContract: (data: Partial<EmploymentContract>) => Promise<EmploymentContract | null>;
  updateContract: (id: string, data: Partial<EmploymentContract>) => Promise<EmploymentContract | null>;
  deleteContract: (id: string) => Promise<boolean>;
  renewContract: (id: string, data: { startDate: string; endDate?: string; baseSalary?: string }) => Promise<EmploymentContract | null>;
  terminateContract: (id: string, data: { terminationDate: string; terminationReason?: string }) => Promise<boolean>;
}

export function useEmploymentContracts(): UseEmploymentContractsReturn {
  const [contracts, setContracts] = useState<EmploymentContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEmploymentContractsReturn['pagination']>(null);

  const fetchContracts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/employment-contracts?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contracts');
      }

      setContracts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contracts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createContract = useCallback(async (data: Partial<EmploymentContract>): Promise<EmploymentContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/employment-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create contract');
      }

      await fetchContracts();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  const updateContract = useCallback(async (id: string, data: Partial<EmploymentContract>): Promise<EmploymentContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employment-contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update contract');
      }

      await fetchContracts();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  const deleteContract = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employment-contracts/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete contract');
      }

      await fetchContracts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contract';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  const renewContract = useCallback(async (id: string, data: { startDate: string; endDate?: string; baseSalary?: string }): Promise<EmploymentContract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employment-contracts/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to renew contract');
      }

      await fetchContracts();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew contract';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

  const terminateContract = useCallback(async (id: string, data: { terminationDate: string; terminationReason?: string }): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employment-contracts/${id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to terminate contract');
      }

      await fetchContracts();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to terminate contract';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchContracts]);

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
    terminateContract,
  };
}



