'use client';

import { useState, useCallback } from 'react';

export interface Employee {
  id: string;
  parishId: string;
  userId: string | null;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  cnp: string | null;
  birthDate: string | null;
  gender: 'male' | 'female' | 'other' | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  county: string | null;
  postalCode: string | null;
  departmentId: string | null;
  positionId: string | null;
  hireDate: string;
  employmentStatus: 'active' | 'on_leave' | 'terminated' | 'retired';
  terminationDate: string | null;
  terminationReason: string | null;
  bankName: string | null;
  iban: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  createdBy: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

interface UseEmployeesReturn {
  employees: Employee[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  fetchEmployees: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    departmentId?: string;
    positionId?: string;
    employmentStatus?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  createEmployee: (data: Partial<Employee>) => Promise<Employee | null>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<Employee | null>;
  deleteEmployee: (id: string) => Promise<boolean>;
  getEmployee: (id: string) => Promise<Employee | null>;
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseEmployeesReturn['pagination']>(null);

  const fetchEmployees = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.parishId) queryParams.append('parishId', params.parishId);
      if (params.departmentId) queryParams.append('departmentId', params.departmentId);
      if (params.positionId) queryParams.append('positionId', params.positionId);
      if (params.employmentStatus) queryParams.append('employmentStatus', params.employmentStatus);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/hr/employees?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employees');
      }

      setEmployees(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEmployee = useCallback(async (data: Partial<Employee>): Promise<Employee | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create employee');
      }

      await fetchEmployees();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create employee';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  const updateEmployee = useCallback(async (id: string, data: Partial<Employee>): Promise<Employee | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update employee');
      }

      await fetchEmployees();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update employee';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete employee');
      }

      await fetchEmployees();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete employee';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees]);

  const getEmployee = useCallback(async (id: string): Promise<Employee | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/hr/employees/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch employee');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch employee';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    loading,
    error,
    pagination,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployee,
  };
}



