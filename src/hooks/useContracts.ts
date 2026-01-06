'use client';

import { useState, useCallback } from 'react';

export interface Contract {
  id: string;
  parishId: string;
  contractNumber: string;
  direction: 'incoming' | 'outgoing';
  type: 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other';
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  clientId: string;
  title: string | null;
  startDate: string;
  endDate: string;
  signingDate: string | null;
  amount: string;
  currency: string;
  paymentFrequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'one_time' | 'custom';
  assetReference: string | null;
  description: string | null;
  terms: string | null;
  notes: string | null;
  renewalDate: string | null;
  autoRenewal: boolean;
  parentContractId: string | null;
  invoiceItemTemplate?: any;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}

export interface ContractInvoice {
  id: string;
  contractId: string;
  invoiceId: string;
  periodYear: number;
  periodMonth: number;
  generatedAt: Date;
  generatedBy: string | null;
  invoice: any;
}

interface ContractSummary {
  totalActive: number;
  totalExpired: number;
  totalTerminated: number;
  totalIncoming: number;
  totalOutgoing: number;
  totalIncomingAmount: number;
  totalOutgoingAmount: number;
  expiringIn30Days: number;
  expiringIn60Days: number;
  expiringIn90Days: number;
}

interface UseContractsReturn {
  contracts: Contract[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null;
  summary: ContractSummary | null;
  fetchContracts: (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    direction?: 'incoming' | 'outgoing';
    type?: 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other';
    status?: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => Promise<void>;
  fetchSummary: (params?: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<void>;
  createContract: (data: Partial<Contract>) => Promise<Contract | null>;
  updateContract: (id: string, data: Partial<Contract>) => Promise<Contract | null>;
  deleteContract: (id: string) => Promise<boolean>;
  renewContract: (id: string, data?: { startDate?: string; endDate?: string; amount?: string }) => Promise<Contract | null>;
  fetchContractInvoices: (contractId: string) => Promise<ContractInvoice[]>;
  generateInvoice: (contractId: string, periodYear: number, periodMonth: number) => Promise<{ invoice: any; contractInvoice: any } | null>;
}

export function useContracts(): UseContractsReturn {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseContractsReturn['pagination']>(null);
  const [summary, setSummary] = useState<ContractSummary | null>(null);

  const fetchContracts = useCallback(async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    parishId?: string;
    direction?: 'incoming' | 'outgoing';
    type?: 'rental' | 'concession' | 'sale_purchase' | 'loan' | 'other';
    status?: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
    clientId?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.direction) queryParams.append('direction', params.direction);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.clientId) queryParams.append('clientId', params.clientId);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await fetch(`/api/accounting/contracts?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contracts');
      }

      setContracts(result.data);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contracts';
      setError(errorMessage);
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (params?: {
    parishId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.parishId) queryParams.append('parishId', params.parishId);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await fetch(`/api/accounting/contracts/summary?${queryParams.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch summary');
      }

      setSummary(result.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  const createContract = useCallback(async (data: Partial<Contract>): Promise<Contract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/accounting/contracts', {
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
      console.error('Error creating contract:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateContract = useCallback(async (id: string, data: Partial<Contract>): Promise<Contract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/contracts/${id}`, {
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
      console.error('Error updating contract:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteContract = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/contracts/${id}`, {
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
      console.error('Error deleting contract:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const renewContract = useCallback(async (id: string, data?: { startDate?: string; endDate?: string; amount?: string }): Promise<Contract | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/contracts/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data || {}),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to renew contract');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to renew contract';
      setError(errorMessage);
      console.error('Error renewing contract:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContractInvoices = useCallback(async (contractId: string): Promise<ContractInvoice[]> => {
    try {
      const response = await fetch(`/api/accounting/contracts/${contractId}/invoices`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contract invoices');
      }

      return result.data;
    } catch (err) {
      console.error('Error fetching contract invoices:', err);
      return [];
    }
  }, []);

  const generateInvoice = useCallback(async (contractId: string, periodYear: number, periodMonth: number): Promise<{ invoice: any; contractInvoice: any } | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/accounting/contracts/${contractId}/generate-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodYear, periodMonth }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate invoice');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate invoice';
      setError(errorMessage);
      console.error('Error generating invoice:', err);
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
    summary,
    fetchContracts,
    fetchSummary,
    createContract,
    updateContract,
    deleteContract,
    renewContract,
    fetchContractInvoices,
    generateInvoice,
  };
}

