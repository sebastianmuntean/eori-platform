'use client';

import { useState, useCallback } from 'react';

export interface Salary {
  id: string;
  employeeId: string;
  contractId: string;
  salaryPeriod: string;
  baseSalary: string;
  grossSalary: string;
  netSalary: string;
  totalBenefits: string;
  totalDeductions: string;
  workingDays: number;
  workedDays: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  paidDate: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseSalariesReturn {
  salaries: Salary[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchSalaries: (params?: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    contractId?: string;
    status?: string;
    periodFrom?: string;
    periodTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createSalary: (data: Partial<Salary>) => Promise<Salary | null>;
  updateSalary: (id: string, data: Partial<Salary>) => Promise<Salary | null>;
  deleteSalary: (id: string) => Promise<boolean>;
  approveSalary: (id: string) => Promise<boolean>;
  paySalary: (id: string, data?: { paidDate?: string; paymentReference?: string }) => Promise<boolean>;
}

export function useSalaries(): UseSalariesReturn {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseSalariesReturn['pagination']>(null);

  const fetchSalaries = useCallback(async (params: {
    page?: number;
    pageSize?: number;
    employeeId?: string;
    contractId?: string;
    status?: string;
    periodFrom?: string;
    periodTo?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.employeeId) queryParams.append('employeeId', params.employeeId);
      if (params.contractId) queryParams.append('contractId', params.contractId);
      if (params.status) queryParams.append('status', params.status);
      if (params.periodFrom) queryParams.append('periodFrom', params.periodFrom);
      if (params.periodTo) queryParams.append('periodTo', params.periodTo);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/salaries?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch salaries');
      }

      setSalaries(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch salaries';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSalary = useCallback(async (data: Partial<Salary>): Promise<Salary | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create salary');
      }

      await fetchSalaries();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create salary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSalaries]);

  const updateSalary = useCallback(async (id: string, data: Partial<Salary>): Promise<Salary | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/salaries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update salary');
      }

      await fetchSalaries();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update salary';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchSalaries]);

  const deleteSalary = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/salaries/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete salary');
      }

      await fetchSalaries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete salary';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSalaries]);

  const approveSalary = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/salaries/${id}/approve`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve salary');
      }

      await fetchSalaries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve salary';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSalaries]);

  const paySalary = useCallback(async (id: string, data?: { paidDate?: string; paymentReference?: string }): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/salaries/${id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark salary as paid');
      }

      await fetchSalaries();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark salary as paid';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchSalaries]);

  return {
    salaries,
    loading,
    error,
    pagination,
    fetchSalaries,
    createSalary,
    updateSalary,
    deleteSalary,
    approveSalary,
    paySalary,
  };
}






